"use client";  
// import Badge from "@/components/ui/badge/Badge";
// import { LineIconAngleDoubleDown, LineIconAngleDoubleUp } from "@/icons/line-icon"; 
import { LineIconCalendar, LineIconCreditCard } from "@/icons/line-icon"; 
import { useEffect, useRef, useState } from "react"; 
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css' 
import { NumericFormat } from "react-number-format";
import Switch from "../../ui/switch/Switch";
import DateRangePickerComponent from '@wojtekmaj/react-daterange-picker';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css'; 
import moment from "moment";
import 'moment/locale/id';
import toast from "react-hot-toast";
import * as Sentry from "@sentry/browser"; 
import { ApexOptions } from "apexcharts";
import { useCookies } from "next-client-cookies";
import { createEventLog } from "@/utils/log";
import { AllCommunityModule, ColDef, ModuleRegistry, ValueFormatterParams, TextFilterModule } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react';  
import dynamic from "next/dynamic";
 
ModuleRegistry.registerModules([AllCommunityModule, TextFilterModule]);

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
}); 
 
export interface BigNumberModel { 
  warehouse_name: string,
  sum_qty: number,
  sum_cost: number,
  sum_inventory: number, 
}; 
   
export interface AccountModel { 
  warehouse_name: string,
  product_code: string, 
  product_name: string, 
  product_units: string, 
  sum_qty: number, 
  sum_cost: number, 
  sum_inventory: number, 
};


export interface SeriesDataModel { 
  date: string,
  garena_shell_330_indico: number, 
  garena_shell_330_indosat: number, 
  gudang_otomax: number, 
  gudang_utama: number, 
  unassigned: number, 
  voucher_telkomsel: number, 
};

export interface SeriesModel { 
  name: string,
  data: number[], 
  type: string, 
};

  
export default function JurnalWarehouse() { 

  const cookies = useCookies();

  // metadata
  const initializedMetadata = useRef(false)

  const reloadStatus = useRef(true)
  const [statusReload, setStatusReload] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
        
  const now = new Date(2025,7,23);
  const dateStart = new Date(2025, 0, 1);
  const dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate()-1);
  
  const startDate = useRef(moment(dateStart).format('YYYY-MM-DD'))
  const endDate = useRef(moment(dateEnd).format('YYYY-MM-DD'))
  const [dateRange, setDateRange] = useState<[Date, Date]>([dateStart, dateEnd]);
  
  const changeStatusReload = () => { 
      reloadStatus.current = !reloadStatus;
      setStatusReload(!statusReload); 
      createEventLog(cookies.get('name')!, '/jurnal/warehouse', 'metadata|status-reload', 'change', reloadStatus.current.toString())
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const changeDateRange = async (newValue) => { 
      setDateRange(newValue)
      if (newValue){
          startDate.current = moment(newValue[0]).format('YYYY-MM-DD')  
          endDate.current = moment(newValue[1]).format('YYYY-MM-DD')  

          fetchBigNumber()
          fetchAccount()
          fetchSeries()
          fetchTable() 
          createEventLog(cookies.get('name')!, '/jurnal/warehouse', 'metadata|datepicker', 'change', newValue)
      } 
  };


  // big number
  const [loadingBigNumber, setLoadingBigNumber] = useState(true);
  const [bigNumberData, setBigNumberData] = useState<BigNumberModel[]>()
    

  // series
  const options: ApexOptions = {
    colors: ["#d53e4f", "#fc8e59", "#fee08b", "#e6f598", "#99d594", "#3388bd"],
    stroke: {
      show: true,
      width: 4,
      curve: 'smooth',
      // colors: ["transparent"],
    },
    // markers: {
    //   size: 0,
    // },
    fill: {
      opacity: 1,
    },
    markers: {
      size: 2, // Size of the marker points
      strokeColors: "#fff", // Marker border color
      strokeWidth: 2,
      hover: {
        size: 6, // Marker size on hover
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    chart: {
      fontFamily: "Outfit, sans-serif",
      // type: "bar",
      type: "line",
      stacked: false,
      zoom: {
        enabled: true,
        allowMouseWheelZoom: false,
        autoScaleYaxis: true
      },
      height: 180,
      toolbar: {
        show: false,
      },
      // stacked: false,
      events: {
        dataPointMouseEnter: function (event, chartContext, opts) {  
          const value = {
            'xaxis': opts['w']['config']['xaxis']['categories'][opts.dataPointIndex],
            'yaxis': opts['w']['config']['series'][opts.seriesIndex]['data'][opts.dataPointIndex],
            'zaxis': opts['w']['config']['series'][opts.seriesIndex]['name']
          } 
          createEventLog(cookies.get('name')!, '/jurnal/warehouse', 'series|barchart', 'hover', JSON.stringify(value))
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    }, 
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true, // Enable tooltip
      // x: {
      //   format: "dd MMM yyyy", // Format for x-axis tooltip
      // },
      // y: {
      //   formatter: (val: number) => `${val}`,
      // },
      marker: {
          show: true,
      }, 
      fixed: {
        enabled: false,
        position: 'topRight',
        offsetX: 0,
        offsetY: 0,
      }, 
    },
    xaxis: {
      categories: [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      // labels: {
      //   formatter: function(value) {
      //     return moment(value).format('DD-MM-YYYY'); 
      //   }
      // }
    },
    yaxis: [
      { 
        labels: { 
          formatter: function(value) {
            return "Rp." + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
          }
        },
        show: true, 
      }, 
      // { 
      //   labels: { 
      //     formatter: function(value) {
      //       return "Rp." + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
      //     }
      //   },
      //   show: false, 
      // },  
      // { 
      //   labels: { 
      //     formatter: function(value) {
      //       return "Rp." + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
      //     }
      //   },
      //   show: false, 
      // },  
      // { 
      //   labels: { 
      //     formatter: function(value) {
      //       return "Rp." + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
      //     }
      //   },
      //   show: false, 
      // },  
      // { 
      //   labels: { 
      //     formatter: function(value) {
      //       return "Rp." + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
      //     }
      //   },
      //   show: false, 
      // },  
      // { 
      //   labels: { 
      //     formatter: function(value) {
      //       return "Rp." + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
      //     }
      //   },
      //   show: false, 
      // },  
    ],
    // annotations: {
    //   yaxis: [
    //     {
    //       y: 0,
    //       borderColor: '#000000',
    //       label: {
    //         text: '0',
    //       //   style: {
    //       //     color: '#fff',
    //       //     background: '#FF0000'
    //       //   }
    //       }
    //     }
    //   ]
    // },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: "right",
      fontFamily: "Outfit",
    },
  };  
  const series : SeriesModel[] = [
    { 
      'name': 'Garena Shell 330 INDICO',
      'data': [],
      'type': 'line',
    },
    { 
      'name': 'Garena Shell 330 INDOSAT',
      'data': [],
      'type': 'line',
    }, 
    { 
      'name': 'Gudang Otomax',
      'data': [],
      'type': 'line',
    }, 
    { 
      'name': 'Gudang Utama',
      'data': [],
      'type': 'line',
    }, 
    { 
      'name': 'Unassigned',
      'data': [],
      'type': 'line',
    }, 
    { 
      'name': 'Voucher TELKOMSEL',
      'data': [],
      'type': 'line',
    }, 
  ];
   
  const [loadingSeries, setloadingSeries] = useState(true); 
  const [seriesData, setSeriesData] = useState<SeriesModel>()

  const [optionDataLine, setOptionDataLine] = useState<ApexOptions>(options)
  const [seriesDataLine, setSeriesDataLine] = useState<SeriesModel[]>(series)

  const typeDate = useRef('MONTH')
  const [dateType, setDateType] = useState<string>("MONTH"); 
  const getButtonClass = (option: "MONTH"|"WEEK"|"DAY") => 
    dateType === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  
  const changeDateType = (newValue: string) => {  
    setDateType(newValue)
    if (newValue) {  
      typeDate.current  = newValue;  
      fetchSeries()
      fetchTable()
      createEventLog(cookies.get('name')!, '/jurnal/warehouse', 'series|tab-date-type', 'change', newValue)
    }
  }; 


  // table
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const column:any = [];
  const data:any = []
  const defaultColDef: ColDef = {
    flex: 1,
  };
  const [loadingTable, setloadingTable] = useState(true); 
  const [columnTable, setColumnTable] = useState<any[]>(column)
  const [dataTable, setDataTable] = useState<any[]>(data)

  // account
  const [loadingAccount, setloadingAccount] = useState(true); 
  const [accountColumnData, setAccountColumnData] = useState<any[]>(column)
  const [accountRowData, setAccountRowData] = useState<any[]>(data) 
 

  // global function
  useEffect(() => {  
    if (!initializedMetadata.current) {
        initializedMetadata.current = true 
        fetchOverview()
        fetchBigNumber()
        fetchAccount()
        fetchSeries()
        fetchTable() 
    } 

    const interval = setInterval(() => {  
      if (reloadStatus.current) {
        fetchOverview()
        fetchBigNumber()
        fetchAccount()
        fetchSeries()
        fetchTable() 
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchOverview() {   
    await fetch('/api/jurnal/warehouse/overview').then((response) => {
        if (response.status >= 500 && response.status < 600) {
            toast.error(response.statusText)
        }  
        return response;
    }).then(async (response) => {
        const result = await response.json()  
        if (result["status"] == true){  
            const dateString = moment(result['data']['_last_update']).locale('id').format('LLLL'); 
            setLastUpdate(dateString)
        } else { 
        toast.error(result['message'])
        } 
    }).catch((error) => { 
        Sentry.captureException(error); 
    });
  }
 
  async function fetchBigNumber() {   
    setLoadingBigNumber(true);
    const paramStartDate = moment(startDate.current).format('YYYY-MM-DD')  
    const paramEndDate = moment(endDate.current).format('YYYY-MM-DD')  
    await fetch('/api/jurnal/warehouse/big-number?start_date='+paramStartDate+'&end_date='+paramEndDate).then((response) => {
        if (response.status >= 500 && response.status < 600) {
            toast.error(response.statusText)
        }  
        return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){    
        setBigNumberData(result['data']) 
      } else { 
        toast.error(result['message'])
      } 
      setLoadingBigNumber(false);
    }).catch((error) => { 
      Sentry.captureException(error); 
      setLoadingBigNumber(false);
    });
 
  }
 
  async function fetchAccount() {   
    setloadingAccount(true);
    const paramStartDate = moment(startDate.current).format('YYYY-MM-DD')  
    const paramEndDate = moment(endDate.current).format('YYYY-MM-DD')  
    await fetch('/api/jurnal/warehouse/account?start_date='+paramStartDate+'&end_date='+paramEndDate).then((response) => {
        if (response.status >= 500 && response.status < 600) {
            toast.error(response.statusText)
        }  
        return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){    
        const tempColumn:any = [] 
        tempColumn.push({field: 'warehouse_name',headerName: 'Warehouse Name', minWidth: 150, filter: true}); 
        tempColumn.push({field: 'product_code',headerName: 'Product Code', minWidth: 150, filter: true, sortable: true});
        tempColumn.push({field: 'product_name',headerName: 'Product Name', minWidth: 300, filter: true});
        tempColumn.push({field: 'sum_qty',headerName: 'Quantity', minWidth: 200, filter: false, type: 'rightAligned'});
        tempColumn.push({field: 'product_units',headerName: 'Unit', minWidth: 100, filter: true});
        tempColumn.push({field: 'sum_cost',headerName: 'Average Cost', minWidth: 200, filter: false, valueFormatter: currencyFormatter, type: 'rightAligned'});
        tempColumn.push({field: 'sum_inventory',headerName: 'Total Inventory', minWidth: 200, filter: false, valueFormatter: currencyFormatter, type: 'rightAligned'});
        
        setAccountColumnData(tempColumn) 
        setAccountRowData(result['data'])
      } else { 
        toast.error(result['message'])
      } 
      setloadingAccount(false);
    }).catch((error) => { 
      Sentry.captureException(error); 
      setloadingAccount(false);
    });
 
  }

  async function fetchSeries() {   
    setloadingSeries(true);
    const paramStartDate = moment(startDate.current).format('YYYY-MM-DD')  
    const paramEndDate = moment(endDate.current).format('YYYY-MM-DD')  
    await fetch('/api/jurnal/warehouse/series?start_date='+paramStartDate+'&end_date='+paramEndDate+'&date_type='+typeDate.current).then((response) => {
        if (response.status >= 500 && response.status < 600) {
            toast.error(response.statusText)
        }  
        return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){  
        // clear data
        options.xaxis!.categories = []
        series[0]['data'] = [] 
        series[1]['data'] = []  
        series[2]['data'] = []  
        series[3]['data'] = []  
        series[4]['data'] = []  
        series[5]['data'] = []  
        // let min = 0;

        result['data'].forEach((element:SeriesDataModel )=> { 
          series[0]['data'].push(element['garena_shell_330_indico'])
          series[1]['data'].push(element['garena_shell_330_indosat'])
          series[2]['data'].push(element['gudang_otomax']) 
          series[3]['data'].push(element['gudang_utama']) 
          series[4]['data'].push(element['unassigned']) 
          series[5]['data'].push(element['voucher_telkomsel']) 
          options.xaxis!.categories.push(element['date'])

          // if (element.garena_shell_330_indico < min) {
          //   min = element.garena_shell_330_indico
          // }
        });
        // (options.yaxis as ApexYAxis[])[0].min = min;
 
        setSeriesData(result);
        setOptionDataLine(options)  
        setSeriesDataLine(series) 
      } else { 
        toast.error(result['message'])
      }  
      setloadingSeries(false);
    }).catch((error) => { 
      Sentry.captureException(error);  
      setloadingSeries(false);
    });
  }
 
  async function fetchTable() {   
    setloadingTable(true);
    const paramStartDate = moment(startDate.current).format('YYYY-MM-DD')  
    const paramEndDate = moment(endDate.current).format('YYYY-MM-DD')  
    await fetch('/api/jurnal/warehouse/table?start_date='+paramStartDate+'&end_date='+paramEndDate+'&date_type='+typeDate.current).then((response) => {
        if (response.status >= 500 && response.status < 600) {
            toast.error(response.statusText)
        }  
        return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){  
        setloadingTable(false);
        const tempColumn:any = [] 
        tempColumn.push({field: 'warehouse_name',headerName: 'Warehouse Name', minWidth: 150, filter: true}); 
        tempColumn.push({field: 'product_code',headerName: 'Product Code', minWidth: 150, filter: true, sortable: true});
        tempColumn.push({field: 'product_name',headerName: 'Product Name', minWidth: 250, filter: true});
        tempColumn.push({field: 'product_units',headerName: 'Unit', minWidth: 100, filter: true});
        Object.keys(result["data"][0]).forEach(function (key) { 
          if ((key != 'label') && (key != 'product_code') && (key != 'product_name') && (key != 'product_units') && (key != 'warehouse_name')){
            tempColumn.push({
              field: key, 
              minWidth: 200, 
              valueFormatter: currencyFormatter, 
              type: 'rightAligned'
            });
          }
        });
        setColumnTable(tempColumn) 
        setDataTable(result['data'])
      } else { 
        toast.error(result['message'])
      } 
      setloadingTable(false);
    }).catch((error) => { 
      Sentry.captureException(error);
      setloadingTable(false);
    });
  }
 
  function currencyFormatter(params: ValueFormatterParams) {
    return params.value == null ? "" : "Rp. " + params.value.toLocaleString().replace(/,/g, '.');
  } 
  

  return (
    <div className="space-y-3">  

      <div className="flex flex-wrap justify-end">
          <div className="float-right m-2 flex">
              Update terakhir : {lastUpdate != null ? lastUpdate : ""} 
          </div>
      </div>

      <div className="block xl:flex justify-end mb-2 ">     
          <div className="flex">
              <span className="m-auto mr-2">Auto Refresh Data</span>
              <Switch
                  label=""
                  defaultChecked={reloadStatus.current}
                  onChange={changeStatusReload} 
              />
          </div>
          <span className="mr-2"></span>
          <div className="relative">
              <DateRangePickerComponent format="dd-MM-y" onChange={changeDateRange} value={dateRange} maxDate={new Date()} rangeDivider="&nbsp;s/d&nbsp;" className="pr-10 bg-white h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"/>
              <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-1 top-1/2 dark:text-gray-400">
                  <LineIconCalendar />
              </span>  
          </div>  
      </div>   
        
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      
        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Big number
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Warehouse item valuation group
            </p>
          </div>  
        </div> 
 
        <div className="grid grid-cols-12 gap-4 md:gap-4 mt-4">  
          {
            loadingBigNumber || !bigNumberData ?
            (
              <> 
                <div className="col-span-12 xl:col-span-4 space-y-3 mr-4">
                  <Skeleton height={50} width={300} className=""/> 
                </div>
                <div className="col-span-12 xl:col-span-4 space-y-3 mr-4">
                  <Skeleton height={50} width={300} className=""/> 
                </div>
                <div className="col-span-12 xl:col-span-4 space-y-3 mr-4">
                  <Skeleton height={50} width={300} className=""/> 
                </div>
              </>
            ) :
            ( 
              bigNumberData?.map((item, index) => (  
                <div key={index} className="col-span-12 xl:col-span-4 space-y-3"> 
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                        <LineIconCreditCard /> 
                      </div> 
                      <span className="text-md text-gray-500 dark:text-gray-400">
                        {item.warehouse_name}
                      </span>  
                    </div>        
                    <div className="text-right">
                      <h4 className="mt-2 font-bold text-gray-800 text-right text-title-sm dark:text-white/90">
                        Rp. <NumericFormat displayType="text" value={item.sum_inventory} thousandSeparator="." decimalSeparator="," decimalScale={0}/> 
                      </h4>
                      <div className="text-right">
                        Quantity : &nbsp;
                        <NumericFormat displayType="text" value={item.sum_qty} thousandSeparator="." decimalSeparator="," decimalScale={0}/> 
                        &nbsp; item
                      </div>
                    </div>  
                  </div>
                </div>   
              ))
            )
          } 
        </div>  

      </div> 
      
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      
        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Detail Tabel 
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Warehouse item valuation per product
            </p>
          </div>  
        </div> 

        <div className="max-w-full overflow-x-auto custom-scrollbar mb-6 mt-5">  
          {
            loadingAccount ?
            ( 
              <div className="mb-4">  
                <Skeleton height={50}  className="min-w-full w-full p-2"/>  
                &nbsp;
                <Skeleton height={50}  className="min-w-full w-full p-2"/>  
                &nbsp;
                <Skeleton height={50}  className="min-w-full w-full p-2"/>  
              </div>
            ) :
            ( 
              <div style={{ width: "100%", height: "600px" }}>
                <AgGridReact
                    rowData={accountRowData}
                    columnDefs={accountColumnData}
                    defaultColDef={defaultColDef} 
                    getRowStyle={(params) => { 
                      if (params.data.account_indent === 0) {
                        return { fontWeight: 'bold' };
                      }
                        return undefined;
                    }}

                    
                /> 
              </div> 
            )
          } 
        </div>
      
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      
        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Grafik Per Waktu Per Kategori
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Warehouse item valuation dari waktu ke waktu
            </p>
          </div>  
        </div> 

        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between"> 
          <div className="w-full">  
          </div>  
          <div className="block xl:flex justify-between mb-2 ">   
            <div className="relative">  
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900  ">
                <button
                  onClick={() => changeDateType("DAY")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("DAY")}`}
                >
                  Harian
                </button>
                <button
                  onClick={() => changeDateType("WEEK")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("WEEK")}`}
                >
                  Mingguan
                </button>
                <button
                  onClick={() => changeDateType("MONTH")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("MONTH")}`}
                >
                  Bulanan
                </button>
              </div>
            </div>
          </div> 
        </div> 

        <div className="max-w-full ">  
          {
            loadingSeries || !seriesData ?
            (
              <div>
                <Skeleton height={400} className=""/>  
                <br/>
              </div>
            ) :
            (
              <div>
                <ReactApexChart
                  options={optionDataLine}
                  series={seriesDataLine}
                  type="bar"
                  height={400}
                />
              </div>
              
            )
          }  
        </div>
      
      </div>
 
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      
        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Detail Tabel 
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Warehouse item valuation per product
            </p>
          </div>  
        </div> 

        <div className="max-w-full overflow-x-auto custom-scrollbar mb-6 mt-5">  
          {
            loadingTable ?
            ( 
              <div className="mb-4">  
                <Skeleton height={50}  className="min-w-full w-full p-2"/>  
                &nbsp;
                <Skeleton height={50}  className="min-w-full w-full p-2"/>  
                &nbsp;
                <Skeleton height={50}  className="min-w-full w-full p-2"/>  
              </div>
            ) :
            ( 
              <div style={{ width: "100%", height: "600px" }}>
                <AgGridReact
                    rowData={dataTable}
                    columnDefs={columnTable}
                    defaultColDef={defaultColDef} 
                    getRowStyle={(params) => { 
                      if (params.data.account_indent === 0) {
                        return { fontWeight: 'bold' };
                      }
                        return undefined;
                    }}

                    
                /> 
              </div> 
            )
          } 
        </div>
      
      </div>

        
    </div>
  );
}
