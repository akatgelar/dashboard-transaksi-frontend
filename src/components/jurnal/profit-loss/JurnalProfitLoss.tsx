"use client";  
// import Badge from "@/components/ui/badge/Badge";
// import { LineIconAngleDoubleDown, LineIconAngleDoubleUp } from "@/icons/line-icon"; 
import { LineIconCalendar, LineIconCreditCard, LineIconWallet } from "@/icons/line-icon"; 
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
  income: number,
  other_income: number,
  expenses: number,
  other_expense: number,
  cost_of_sales: number, 
  summary: number, 
  summary_text: string, 
  summary_bg: string, 
}; 

export interface SeriesDataModel { 
  date: string,
  income: number, 
  expense: number, 
  diff: number, 
};

export interface SeriesModel { 
  name: string,
  data: number[], 
  type: string, 
};

export interface AccountModel { 
  type: string,
  account_number: string, 
  account_name: string, 
  sum: number, 
};

  
export default function JurnalProfitLoss() { 

  const cookies = useCookies();

  // metadata
  const initializedMetadata = useRef(false)

  const reloadStatus = useRef(true)
  const [statusReload, setStatusReload] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
        
  const now = new Date(2025, 10, 21)
  const dateStart = new Date(2025, 0, 1);
  const dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startDate = useRef(moment(dateStart).format('YYYY-MM-DD'))
  const endDate = useRef(moment(dateEnd).format('YYYY-MM-DD'))
  const [dateRange, setDateRange] = useState<[Date, Date]>([dateStart, dateEnd]);
  
  const changeStatusReload = () => { 
      reloadStatus.current = !reloadStatus;
      setStatusReload(!statusReload); 
      createEventLog(cookies.get('name')!, '/jurnal/profit-loss', 'metadata|status-reload', 'change', reloadStatus.current.toString())
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const changeDateRange = async (newValue) => { 
      setDateRange(newValue)
      if (newValue){
          startDate.current = moment(newValue[0]).format('YYYY-MM-DD')  
          endDate.current = moment(newValue[1]).format('YYYY-MM-DD')  

          fetchBigNumber()
          fetchSeries()
          fetchTable()
          fetchAccount()
          createEventLog(cookies.get('name')!, '/jurnal/profit-loss', 'metadata|datepicker', 'change', newValue)
      } 
  };


  // big number
  const [loadingBigNumber, setLoadingBigNumber] = useState(true);
  const [bigNumberData, setBigNumberData] = useState<BigNumberModel>()
    

  // series
  const options: ApexOptions = {
    colors: ["#54c58a", "#f36d66", "#4fb7f0"],
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
        allowMouseWheelZoom: false
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
          createEventLog(cookies.get('name')!, '/jurnal/profit-loss', 'series|barchart', 'hover', JSON.stringify(value))
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
        // title: {
        //   text: "Pendapatan & Beban",
        // },
        labels: { 
          formatter: function(value) {
            return "Rp." + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
          }
        },
        show: true,
        min: 0
      }, 
      // {
      //   title: {
      //     text: "",
      //   },
      //   labels: { 
      //     formatter: function(value) {
      //       return "Rp." + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
      //     }
      //   },
      //   show: false,
      //   min: -7362376349
      // }, 
      // {
      //   opposite: true,
      //   title: {
      //     text: "Profit / Loss",
      //   },
      //   labels: { 
      //     formatter: function(value) {
      //       return "Rp." + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
      //     }
      //   },
      //   show: true,
      //   min: -7362376349
      // }
    ],
    annotations: {
      yaxis: [
        {
          y: 0,
          borderColor: '#000000',
          label: {
            text: '0',
          //   style: {
          //     color: '#fff',
          //     background: '#FF0000'
          //   }
          }
        }
      ]
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: "right",
      fontFamily: "Outfit",
    },
  };  
  const series : SeriesModel[] = [
    { 
      'name': 'Pendapatan',
      'data': [],
      'type': 'column',
    },
    { 
      'name': 'Beban',
      'data': [],
      'type': 'column',
    }, 
    { 
      'name': 'Profit / Loss',
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
      createEventLog(cookies.get('name')!, '/jurnal/profit-loss', 'series|tab-date-type', 'change', newValue)
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
  const [accountData, setAccountData] = useState<AccountModel[]>()
 

  // global function
  useEffect(() => {  
    if (!initializedMetadata.current) {
        initializedMetadata.current = true 
        fetchOverview()
        fetchBigNumber()
        fetchSeries()
        fetchTable()
        fetchAccount()
    } 

    const interval = setInterval(() => {  
      if (reloadStatus.current) {
        fetchOverview()
        fetchBigNumber()
        fetchSeries()
        fetchTable()
        fetchAccount()
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchOverview() {   
    await fetch('/api/jurnal/profit-loss/overview').then((response) => {
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
    await fetch('/api/jurnal/profit-loss/big-number?start_date='+paramStartDate+'&end_date='+paramEndDate).then((response) => {
        if (response.status >= 500 && response.status < 600) {
            toast.error(response.statusText)
        }  
        return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){  
        const summary = (result["data"]["now_income"] + result["data"]["now_other_income"]) - (result["data"]["now_cost_of_sales"] + result["data"]["now_expenses"] + result["data"]["now_other_expense"])
        let summaryText = ""
        let summaryBg = ""
        if (summary > 0) {
          summaryText = "Laba"
          summaryBg = "green"
        } else { 
          summaryText = "Rugi"
          summaryBg = "red"
        } 

        setBigNumberData({ 
          income: result["data"]["now_income"],
          other_income: result["data"]["now_other_income"],
          cost_of_sales: result["data"]["now_cost_of_sales"], 
          expenses: result["data"]["now_expenses"], 
          other_expense: result["data"]["now_other_expense"], 
          summary: summary,
          summary_text: summaryText,
          summary_bg: summaryBg,
        }) 
      } else { 
        toast.error(result['message'])
      } 
      setLoadingBigNumber(false);
    }).catch((error) => { 
      Sentry.captureException(error); 
      setLoadingBigNumber(false);
    });
  }

  async function fetchSeries() {   
    setloadingSeries(true);
    const paramStartDate = moment(startDate.current).format('YYYY-MM-DD')  
    const paramEndDate = moment(endDate.current).format('YYYY-MM-DD')  
    await fetch('/api/jurnal/profit-loss/series?start_date='+paramStartDate+'&end_date='+paramEndDate+'&date_type='+typeDate.current).then((response) => {
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
        let min = 0;

        result['data'].forEach((element:SeriesDataModel )=> { 
          series[0]['data'].push(element['income'])
          series[1]['data'].push(element['expense'])
          series[2]['data'].push(element['diff']) 
          options.xaxis!.categories.push(element['date'])

          if (element.diff < min) {
            min = element.diff
          }
        });
        (options.yaxis as ApexYAxis[])[0].min = min;
 

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
 
  async function fetchAccount() {   
    setloadingAccount(true);
    const paramStartDate = moment(startDate.current).format('YYYY-MM-DD')  
    const paramEndDate = moment(endDate.current).format('YYYY-MM-DD')  
    await fetch('/api/jurnal/profit-loss/account?start_date='+paramStartDate+'&end_date='+paramEndDate).then((response) => {
        if (response.status >= 500 && response.status < 600) {
            toast.error(response.statusText)
        }  
        return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){  
        setloadingAccount(false); 
        setAccountData(result['data'])
      } else { 
        toast.error(result['message'])
      } 
      setloadingAccount(false);
    }).catch((error) => { 
      Sentry.captureException(error);
      setloadingAccount(false);
    });
  }
 
  async function fetchTable() {   
    setloadingTable(true);
    const paramStartDate = moment(startDate.current).format('YYYY-MM-DD')  
    const paramEndDate = moment(endDate.current).format('YYYY-MM-DD')  
    await fetch('/api/jurnal/profit-loss/table?start_date='+paramStartDate+'&end_date='+paramEndDate+'&date_type='+typeDate.current).then((response) => {
        if (response.status >= 500 && response.status < 600) {
            toast.error(response.statusText)
        }  
        return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){  
        setloadingTable(false);
        const tempColumn:any = [] 
        tempColumn.push({field: 'category_name',headerName: 'Category Name', minWidth: 150, filter: true}); 
        tempColumn.push({field: 'account_number',headerName: 'Account Number', minWidth: 150, filter: true, sortable: true});
        tempColumn.push({field: 'account_name',headerName: 'Account Name', minWidth: 250, filter: true});
        Object.keys(result["data"][0]).forEach(function (key) { 
          if ((key != 'label') && (key != 'category_id') && (key != 'category_name') && (key != 'account_id') && (key != 'account_number') && (key != 'account_name') && (key != 'account_indent') ){
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
 
 
  function convertCurrency(params: number) {
    return params == null ? "" : "Rp. " + params.toLocaleString().replace(/,/g, '.');
  }


  // report variable
  let totalKepala4 = 0;
  let totalKepala5 = 0; 
  let totalKepala6 = 0; 
  let totalKepala7 = 0; 
  let totalKepala8 = 0; 

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
              Jurnal account - keuntungan dan kerugian
            </p>
          </div>  
        </div> 
 
        <div className="grid grid-cols-12 gap-4 md:gap-4 mt-4"> 

            <div className="col-span-12 xl:col-span-4 space-y-3">
              <div className="col-span-12 xl:col-span-4 space-y-3"> 
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                      <LineIconCreditCard /> 
                    </div> 
                    <span className="text-md text-gray-500 dark:text-gray-400">
                      Pendapatan
                    </span> 
                  </div>    
                  {
                    loadingBigNumber || !bigNumberData ?
                    (
                      <div className="flex items-end justify-between mt-2">  
                        <Skeleton height={20} width={100} className=""/>
                        <Skeleton height={20} width={50} />
                      </div>
                    ) :
                    ( 
                      <div className="flow lg:flex items-end justify-between">  
                        <div>
                          <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                            <NumericFormat displayType="text" value={bigNumberData?.income} thousandSeparator="." decimalSeparator="," prefix="Rp. "/> 
                          </h4>
                        </div> 
                      </div> 
                    )
                  }
                </div>
              </div> 
              <div className="col-span-12 xl:col-span-4 space-y-3"> 
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                      <LineIconCreditCard /> 
                    </div> 
                    <span className="text-md text-gray-500 dark:text-gray-400">
                      Pendapatan Lainnya
                    </span> 
                  </div>    
                  {
                    loadingBigNumber || !bigNumberData ?
                    (
                      <div className="flex items-end justify-between mt-2">  
                        <Skeleton height={20} width={100} className=""/>
                        <Skeleton height={20} width={50} />
                      </div>
                    ) :
                    ( 
                      <div className="flow lg:flex items-end justify-between">  
                        <div>
                          <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                            <NumericFormat displayType="text" value={bigNumberData?.other_income} thousandSeparator="." decimalSeparator="," prefix="Rp. "/> 
                          </h4>
                        </div> 
                      </div> 
                    )
                  }
                </div>
              </div> 
            </div>

            <div className="col-span-12 xl:col-span-4 space-y-3">
              <div className="col-span-12 xl:col-span-4 space-y-3"> 
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-xl dark:bg-red-800">
                      <LineIconCreditCard /> 
                    </div> 
                    <span className="text-md text-gray-500 dark:text-gray-400">
                      Beban
                    </span> 
                  </div>    
                  {
                    loadingBigNumber || !bigNumberData ?
                    (
                      <div className="flex items-end justify-between mt-2">  
                        <Skeleton height={20} width={100} className=""/>
                        <Skeleton height={20} width={50} />
                      </div>
                    ) :
                    ( 
                      <div className="flow lg:flex items-end justify-between">  
                        <div>
                          <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                            <NumericFormat displayType="text" value={bigNumberData?.expenses} thousandSeparator="." decimalSeparator="," prefix="Rp. "/> 
                          </h4>
                        </div> 
                      </div> 
                    )
                  }
                </div>
              </div> 
              <div className="col-span-12 xl:col-span-4 space-y-3"> 
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-xl dark:bg-red-800">
                      <LineIconCreditCard /> 
                    </div> 
                    <span className="text-md text-gray-500 dark:text-gray-400">
                      Beban Lainnya
                    </span> 
                  </div>    
                  {
                    loadingBigNumber || !bigNumberData ?
                    (
                      <div className="flex items-end justify-between mt-2">  
                        <Skeleton height={20} width={100} className=""/>
                        <Skeleton height={20} width={50} />
                      </div>
                    ) :
                    ( 
                      <div className="flow lg:flex items-end justify-between">  
                        <div>
                          <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                            <NumericFormat displayType="text" value={bigNumberData?.other_expense} thousandSeparator="." decimalSeparator="," prefix="Rp. "/> 
                          </h4>
                        </div> 
                      </div> 
                    )
                  }
                </div>
              </div> 
              <div className="col-span-12 xl:col-span-4 space-y-3"> 
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-xl dark:bg-red-800">
                      <LineIconCreditCard /> 
                    </div> 
                    <span className="text-md text-gray-500 dark:text-gray-400">
                      Harga Pokok Penjualan
                    </span> 
                  </div>    
                  {
                    loadingBigNumber || !bigNumberData ?
                    (
                      <div className="flex items-end justify-between mt-2">  
                        <Skeleton height={20} width={100} className=""/>
                        <Skeleton height={20} width={50} />
                      </div>
                    ) :
                    ( 
                      <div className="flow lg:flex items-end justify-between">  
                        <div>
                          <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                            <NumericFormat displayType="text" value={bigNumberData?.cost_of_sales} thousandSeparator="." decimalSeparator="," prefix="Rp. "/> 
                          </h4>
                        </div> 
                      </div> 
                    )
                  }
                </div>
              </div> 
            </div>
            
            <div className="col-span-12 xl:col-span-4 space-y-3">
              <div className="col-span-12 xl:col-span-4 space-y-3"> 
                <div className={`rounded-2xl p-5 border border-gray-200 dark:border-gray-800 bg-${bigNumberData?.summary_bg}-100 dark:bg-${bigNumberData?.summary_bg}/[0.03] md:p-4`}>
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-10 h-10 bg-${bigNumberData?.summary_bg}-300 rounded-xl dark:bg-${bigNumberData?.summary_bg}-800`}>
                      <LineIconWallet /> 
                    </div> 
                    <span className="text-md text-gray-500 dark:text-gray-400">
                      {bigNumberData?.summary_text}
                    </span> 
                  </div>    
                  {
                    loadingBigNumber || !bigNumberData ?
                    (
                      <div className="flex items-end justify-between mt-2">  
                        <Skeleton height={20} width={100} className=""/>
                        <Skeleton height={20} width={50} />
                      </div>
                    ) :
                    ( 
                      <div className="flow lg:flex items-end justify-between">  
                        <div>
                          <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                            <NumericFormat displayType="text" value={bigNumberData?.summary} thousandSeparator="." decimalSeparator="," prefix="Rp. "/> 
                          </h4>
                        </div> 
                      </div> 
                    )
                  }
                </div>
              </div> 
            </div>

        </div> 
         
      </div> 

      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Profit and Loss
              </h3>  
              <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                Laporan per account number
              </p>
            </div>  
          </div> 

          <div className="grid grid-cols-12 gap-4 md:gap-4 mt-6 mb-6"> 
            <div className="col-span-12 xl:col-span-12 space-y-3 border border-gray-200">   
            
                {
                  loadingAccount || !accountData ?
                  ( 
                    <div>
                      <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                          <div className="flex items-center w-1/5">
                              <Skeleton height={20} width={100} className=""/>
                          </div>
                          <div className="flex items-center w-3/5">
                              <Skeleton height={20} width={100} className=""/>
                          </div>
                          <div className="text-right w-1/5">
                              <Skeleton height={20} width={100} className=""/>
                          </div>
                      </div>
                      <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                          <div className="flex items-center w-1/5">
                              <Skeleton height={20} width={100} className=""/>
                          </div>
                          <div className="flex items-center w-3/5">
                              <Skeleton height={20} width={100} className=""/>
                          </div>
                          <div className="text-right w-1/5">
                              <Skeleton height={20} width={100} className=""/>
                          </div>
                      </div>
                      <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                          <div className="flex items-center w-1/5">
                              <Skeleton height={20} width={100} className=""/>
                          </div>
                          <div className="flex items-center w-3/5">
                              <Skeleton height={20} width={100} className=""/>
                          </div>
                          <div className="text-right w-1/5">
                              <Skeleton height={20} width={100} className=""/>
                          </div>
                      </div>
                    </div>
                  ) :
                  ( 
                    <ul className="mt-1">  
                        {/* kepala 4 */}
                        <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex items-center w-3/5 gap-3">
                                <p className="text-sm text-gray-500 truncate"><b>Pendapatan</b></p>
                            </div> 
                        </div>
                        {
                          accountData?.map((item, index) => {
                          if (item.account_number.toLowerCase().includes('4-')) { 
                            totalKepala4 += item.sum;
                            return (
                              <div key={index} className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                                  <div className="flex items-center w-1/5">
                                      <span className="block text-sm text-gray-400">{item.account_number}</span>
                                  </div>
                                  <div className="flex items-center w-3/5">
                                      <span className="block text-sm text-gray-400">{item.account_name}</span>
                                  </div>
                                  <div className="text-right w-1/5">
                                      <span className="block text-sm text-gray-400">{convertCurrency(item.sum)}</span>
                                  </div>
                              </div>
                            );
                          }  
                          return null;
                        })} 
                        <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex items-center w-1/5 gap-3"> 
                              <span className="block text-sm text-gray-400">Total dari pendapatan</span>
                            </div>
                            <div className="flex items-center w-3/5">
                            </div>
                            <div className="w-1/5 text-right">
                                <span className="block text-sm text-gray-400">{convertCurrency(totalKepala4)}</span>
                            </div>
                        </div> 

                        {/* kepala 5 */}
                        <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex items-center w-3/5 gap-3">
                                <p className="text-sm text-gray-500 truncate"><b>Beban pokok pendapatan</b></p>
                            </div> 
                        </div>
                        {
                          accountData?.map((item, index) => {
                          if (item.account_number.toLowerCase().includes('5-')) { 
                            totalKepala5 += item.sum;
                            return (
                              <div key={index} className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                                  <div className="flex items-center w-1/5">
                                      <span className="block text-sm text-gray-400">{item.account_number}</span>
                                  </div>
                                  <div className="flex items-center w-3/5">
                                      <span className="block text-sm text-gray-400">{item.account_name}</span>
                                  </div>
                                  <div className="text-right w-1/5">
                                      <span className="block text-sm text-gray-400">{convertCurrency(item.sum)}</span>
                                  </div>
                              </div>
                            );
                          }  
                          return null;
                        })} 
                        <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex items-center w-1/5 gap-3"> 
                              <span className="block text-sm text-gray-400">Total dari pendapatan</span>
                            </div>
                            <div className="flex items-center w-3/5">
                            </div>
                            <div className="w-1/5 text-right">
                              <span className="block text-sm text-gray-400">{convertCurrency(totalKepala5)}</span>
                            </div>
                        </div>

                        {/* laba kotor */}
                        <div className="flex cursor-pointer items-center px-2 py-2 bg-gray-100 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray/[0.03]">
                            <div className="flex items-center w-1/5 gap-3"> 
                                <p className="text-sm text-gray-500 truncate"><b>Laba kotor</b></p>
                            </div> 
                            <div className="flex items-center w-3/5">
                            </div>
                            <div className="w-1/5 text-right">
                                <span className="block text-sm text-gray-400 "><b>{convertCurrency(totalKepala4 - totalKepala5)}</b></span>
                            </div>
                        </div>
                        <br/>


                        {/* kepala 6 */}
                        <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex items-center w-3/5 gap-3">
                                <p className="text-sm text-gray-500 truncate"><b>Beban operasional</b></p>
                            </div> 
                        </div>
                        {
                          accountData?.map((item, index) => {
                          if (item.account_number.toLowerCase().includes('6-')) { 
                            totalKepala6 += item.sum;
                            return (
                              <div key={index} className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                                  <div className="flex items-center w-1/5">
                                      <span className="block text-sm text-gray-400">{item.account_number}</span>
                                  </div>
                                  <div className="flex items-center w-3/5">
                                      <span className="block text-sm text-gray-400">{item.account_name}</span>
                                  </div>
                                  <div className="text-right w-1/5">
                                      <span className="block text-sm text-gray-400">{convertCurrency(item.sum)}</span>
                                  </div>
                              </div>
                            );
                          }  
                          return null;
                        })} 
                        <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex items-center w-1/5 gap-3"> 
                              <span className="block text-sm text-gray-400">Total dari beban operasional</span>
                            </div>
                            <div className="flex items-center w-3/5">
                            </div>
                            <div className="w-1/5 text-right">
                              <span className="block text-sm text-gray-400">{convertCurrency(totalKepala6)}</span>
                            </div>
                        </div>

                        {/* laba operasional */}
                        <div className="flex cursor-pointer items-center px-2 py-2 bg-gray-100 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray/[0.03]">
                            <div className="flex items-center w-1/5 gap-3"> 
                                <p className="text-sm text-gray-500 truncate"><b>Laba operasional</b></p>
                            </div> 
                            <div className="flex items-center w-3/5">
                            </div>
                            <div className="w-1/5 text-right">
                                <span className="block text-sm text-gray-400 "><b>{convertCurrency(totalKepala4-totalKepala5-totalKepala6)}</b></span>
                            </div>
                        </div> 
                        <br/>

                        
                        {/* kepala 7 */}
                        <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex items-center w-3/5 gap-3">
                                <p className="text-sm text-gray-500 truncate"><b>Pendapatan lain-lain</b></p>
                            </div> 
                        </div>
                        {
                          accountData?.map((item, index) => {
                          if (item.account_number.toLowerCase().includes('7-')) { 
                            totalKepala7 += item.sum;
                            return (
                              <div key={index} className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                                  <div className="flex items-center w-1/5">
                                      <span className="block text-sm text-gray-400">{item.account_number}</span>
                                  </div>
                                  <div className="flex items-center w-3/5">
                                      <span className="block text-sm text-gray-400">{item.account_name}</span>
                                  </div>
                                  <div className="text-right w-1/5">
                                      <span className="block text-sm text-gray-400">{convertCurrency(item.sum)}</span>
                                  </div>
                              </div>
                            );
                          }  
                          return null;
                        })}  
                        <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex items-center w-1/5 gap-3"> 
                              <span className="block text-sm text-gray-400">Total dari pendapatan lain-lain</span>
                            </div>
                            <div className="flex items-center w-3/5">
                            </div>
                            <div className="w-1/5 text-right">
                              <span className="block text-sm text-gray-400">{convertCurrency(totalKepala7)}</span>
                            </div>
                        </div>

                        {/* kepala 8 */}
                        <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex items-center w-3/5 gap-3">
                                <p className="text-sm text-gray-500 truncate"><b>Beban lain-lain</b></p>
                            </div> 
                        </div>
                        {
                          accountData?.map((item, index) => {
                          if (item.account_number.toLowerCase().includes('8-')) { 
                            totalKepala8 += (-1 * item.sum);
                            return (
                              <div key={index} className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                                  <div className="flex items-center w-1/5">
                                      <span className="block text-sm text-gray-400">{item.account_number}</span>
                                  </div>
                                  <div className="flex items-center w-3/5">
                                      <span className="block text-sm text-gray-400">{item.account_name}</span>
                                  </div>
                                  <div className="text-right w-1/5">
                                      <span className="block text-sm text-gray-400">{convertCurrency(-1 * item.sum)}</span>
                                  </div>
                              </div>
                            );
                          }  
                          return null;
                        })} 
                        <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex items-center w-1/5 gap-3"> 
                              <span className="block text-sm text-gray-400">Total dari beban lain-lain</span>
                            </div>
                            <div className="flex items-center w-3/5">
                            </div>
                            <div className="w-1/5 text-right">
                              <span className="block text-sm text-gray-400">{convertCurrency(totalKepala8)}</span>
                            </div>
                        </div>

                        {/* laba rugi */}
                        <div className="flex cursor-pointer items-center px-2 py-2 bg-gray-100 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray/[0.03]">
                            <div className="flex items-center w-1/5 gap-3"> 
                                <p className="text-sm text-gray-500 truncate"><b>Total pendapatan (beban lain-lain)</b></p>
                            </div> 
                            <div className="flex items-center w-3/5">
                            </div>
                            <div className="w-1/5 text-right">
                                <span className="block text-sm text-gray-400 "><b>{convertCurrency(totalKepala7+totalKepala8)}</b></span>
                            </div>
                        </div>
                        <br/>


                        {/* laba rugi */}
                        <div className="flex cursor-pointer items-center px-2 py-2 bg-gray-100 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray/[0.03]">
                            <div className="flex items-center w-1/5 gap-3"> 
                                <p className="text-md text-gray-500 truncate"><b>Laba (rugi)</b></p>
                            </div> 
                            <div className="flex items-center w-3/5">
                            </div>
                            <div className="w-1/5 text-right">
                                <span className="block text-md text-gray-400 "><b>{convertCurrency(totalKepala4-totalKepala5-totalKepala6+totalKepala7+totalKepala8)}</b></span>
                            </div>
                        </div>
 
                    </ul> 
                  )
                }
            
            </div>
          </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      
        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Grafik Per Waktu Per Kategori
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Jurnal account category - keuntungan dan kerugian
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
              Detail Tabel Per Item
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Jurnal account name - keuntungan dan kerugian
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
