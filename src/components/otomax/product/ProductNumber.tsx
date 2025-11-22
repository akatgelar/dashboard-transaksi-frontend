'use client' 

import { useEffect, useRef, useState } from "react";
import { LineIconCheckCircle } from "@/icons/line-icon";  
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css';  
import { NumericFormat } from "react-number-format";
import Badge from "../../ui/badge/Badge";   
import toast from "react-hot-toast";
import * as Sentry from "@sentry/browser";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css' 
import { ApexOptions } from "apexcharts";     
import { createEventLog } from "@/utils/log";
import { useCookies } from 'next-client-cookies'; 
import dynamic from "next/dynamic";
import moment from "moment";
import { AllCommunityModule, ModuleRegistry, TextFilterModule } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react';  
import * as XLSX from "xlsx";

ModuleRegistry.registerModules([AllCommunityModule, TextFilterModule]);

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
}); 

export interface NumberModel {
  product_all: number;  
  product_active: number;  
  product_active_percent: number;  
  transaksi: number;  
  omset: number; 
  margin: number;  
} 

export interface CategoryModel {
  category: string;
  transaksi: number;
  omset: number;
  margin: number; 
} 
export interface SeriesCategoryModel { 
  name: string,
  data: number[], 
};
export interface TableModel {
  category: string;
  transaksi: number; 
  omset: number;
  omset_percent: number;
  margin: number; 
  margin_percent: number; 
}

export interface TanggalModel {
  tanggal: string;
  transaksi: number;
  omset: number;
  margin: number; 
}
export interface SeriesTanggalModel { 
  name: string,
  data: number[], 
};


export interface ParamProps {
  statusReload: boolean; 
  dateRange: [Date, Date];  
}

export default function ProductNumber({statusReload, dateRange}:ParamProps) { 
  
  const cookies = useCookies();

  // data number
  const [loadingProductNumber, setLoadingProductNumber] = useState(true);
  const [productNumberData, setProductNumberData] = useState<NumberModel>()
    

  // data category
  const [loadingProductCategory, setLoadingProductCategory] = useState(true);
  const [productCategoryData, setProductCategoryData] = useState<CategoryModel[]>() 
  const seriesCategoryTemp = [
    {
      name: 'Hit Transaksi',
      data: [] as number[],
    }, 
    {
      name: 'Omset',
      data: [] as number[],
    },
    {
      name: 'Margin',
      data: [] as number[], 
    }
  ];
  const optionsCategoryTemp: ApexOptions = {
    colors: ["#f0b000", "#00c950", "#2c7fff"],
    stroke: {
      show: false,
      width: 1,
      colors: ["transparent"],
    },
    fill: {
      opacity: 1,
    },
    markers: {
      size: 0, // Size of the marker points
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
      type: "treemap",
      height: 180,
      toolbar: {
        show: false,
      },
      stacked: false,
      events: {
        dataPointMouseEnter: function (event, chartContext, opts) { 
          const value = {
            'xaxis': opts['w']['config']['xaxis']['categories'][opts.dataPointIndex],
            'yaxis': opts['w']['config']['series'][opts.seriesIndex]['data'][opts.dataPointIndex],
            'zaxis': opts['w']['config']['series'][opts.seriesIndex]['name']
          }
          createEventLog(cookies.get('name')!, '/otomax/product', 'number-product|barchart-category', 'hover', JSON.stringify(value))
        }
      }
    },
    plotOptions: { 
      bar: {
        horizontal: false,
        columnWidth: "80%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,   
    },
    tooltip: {
      enabled: true,   
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
      categories:  [], 
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      }, 
      labels: {
        rotate: 0
      }
    },
    yaxis: [ 
      { 
        title: {
          text: 'Jumlah Hit'
        },
        labels: { 
          formatter: function(value) {
            return value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
          }
        } , 
      },
      {
        logarithmic: true,
        opposite: true,
        title: {
          text: 'Nilai Rupiah'
        },
        labels: { 
          formatter: function(value) {
            return 'Rp. ' + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
          }
        },
      },
      { 
        opposite: true,
        title: {
          text: 'Nilai Rupiah'
        },
        labels: { 
          formatter: function(value) {
            return 'Rp. ' + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
          }
        }, 
        show: false,  
      }
    ],
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: "right",
      fontFamily: "Outfit",
    }, 
  }; 
  const [optionsCategory, setOptionsCategory] = useState<ApexOptions>(optionsCategoryTemp)
  const [seriesCategory, setSeriesCategory] = useState<SeriesCategoryModel[]>(seriesCategoryTemp) 


  // data table
  const [loadingProductTable, setLoadingProductTable] = useState(true);
  const [productTableData, setProductTableData] = useState<TableModel[]>()
  let rowData = [] as TableModel[]
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const colDefs :any = [ 
    { field: "category", headerName: "Nama Provider", filter: true, minWidth: 100}, 
    { field: "transaksi", headerName: "Transaksi" , minWidth: 50, type: 'rightAligned',
      valueFormatter: (params: { value: { toLocaleString: () => string; }; }) => {
        if (params.value) {
          return params.value.toLocaleString().replace(/,/g, '.'); 
        }
        return '';
      }
    }, 
    { field: "omset", headerName: "Omset", minWidth: 200, type: 'rightAligned',
      valueFormatter: (params: { value: { toLocaleString: () => string; }; }) => {
        if (params.value) {
          return  'Rp. ' + params.value.toLocaleString().replace(/,/g, '.'); 
        }
        return '';
      }
    },
    { field: "omset_percent", headerName: "Omset Persen", minWidth: 50, type: 'rightAligned',
      valueFormatter: (params: { value: { toLocaleString: () => string; }; }) => {
        if (params.value) {
          return params.value.toLocaleString().replace(/,/g, '.') + ' %'; 
        }
        return '';
      }
    },
    { field: "margin", headerName: "Margin", minWidth: 200, type: 'rightAligned',
      valueFormatter: (params: { value: { toLocaleString: () => string; }; }) => {
        if (params.value) {
          return  'Rp. ' + params.value.toLocaleString().replace(/,/g, '.'); 
        }
        return '';
      }
    },
    { field: "margin_percent", headerName: "Margin Persen", minWidth: 50, type: 'rightAligned',
      valueFormatter: (params: { value: { toLocaleString: () => string; }; }) => {
        if (params.value) {
          return  params.value.toLocaleString().replace(/,/g, '.') + ' %'; 
        }
        return '';
      }
    }
  ]


  // data line chart
  const [loadingProductTanggal, setLoadingProductTanggal] = useState(true);
  const [productTanggalData, setProductTanggalData] = useState<TanggalModel[]>() 
  const optionsTanggalTemp: ApexOptions = {
    colors: ["#f0b000", "#00c950", "#2c7fff"],
    stroke: {
      show: true,
      width: 1,
      colors: ["transparent"], 
    },
    fill: {
      opacity: 1,
    },
    markers: {
      size: 0, // Size of the marker points
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
      type: "line",
      height: 180,
      toolbar: {
        show: false,
      },
      stacked: false,
      events: {
        dataPointMouseEnter: function (event, chartContext, opts) { 
          const value = {
            'xaxis': opts['w']['config']['xaxis']['categories'][opts.dataPointIndex],
            'yaxis': opts['w']['config']['series'][opts.seriesIndex]['data'][opts.dataPointIndex],
            'zaxis': opts['w']['config']['series'][opts.seriesIndex]['name']
          }
          createEventLog(cookies.get('name')!, '/otomax/product', 'number-product|barchart-series', 'hover', JSON.stringify(value))
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "80%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
      // line: {
      //   isSlopeChart: false,
      //   colors: {
      //       threshold: 0,
      //       colorAboveThreshold: undefined,
      //       colorBelowThreshold: undefined,
      //   }
      // }
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,   
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
      categories:  [], 
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
        title: {
          text: 'Jumlah Hit'
        },
        labels: { 
          formatter: function(value) {
            return value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
          }
        }
        // categories: ['HR', 'Sales', 'IT', 'Finance', 'Marketing']
      },
      {
        opposite: true,
        title: {
          text: 'Nilai Rupiah'
        },
        labels: { 
          formatter: function(value) {
            return 'Rp. ' + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
          }
        }
      },
      {
        opposite: true,
        title: {
          text: 'Nilai Rupiah'
        },
        labels: { 
          formatter: function(value) {
            return 'Rp. ' + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
          }
        },
        show: false, // Hide axis line but still use it for scaling
      }

    ],
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: "right",
      fontFamily: "Outfit",
    },
  }; 
  const seriesTanggalTemp = [
    {
      name: 'Hit Transaksi',
      data: []as number[],
    }, 
    {
      name: 'Omset',
      data: []as number[],
    },
    {
      name: 'Margin',
      data: []as number[],
    }
  ];
  const [optionsTanggal, setOptionsTanggal] = useState<ApexOptions>(optionsTanggalTemp)
  const [seriesTanggal, setSeriesTanggal] = useState<SeriesTanggalModel[]>(seriesTanggalTemp)
  


  // tab module
  const typeModule = useRef('ALL')
  const [moduleType, setModuleType] = useState<string>("ALL"); 

  const getButtonClassModule = (option: "ALL" | "H2H" | "RETAIL" | "WEB") =>
    moduleType === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  const changeModuleType = (newValue: string) => {  
    setModuleType(newValue)
    if (newValue) {  
      typeModule.current  = newValue;  
      fetchProductNumber() 
      fetchProductSeries()
      createEventLog(cookies.get('name')!, '/otomax/produk', 'number-product|tab-module-type', 'change', newValue)
    }
  };

  // tab tanggal
  const [dateType, setDateType] = useState<string>("DAY"); 
  const typeDate = useRef('DAY')
  
  const getButtonClassDate = (option: "MONTH"|"WEEK"|"DAY") => 
    dateType === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  const changeDateType = (newValue: string) => {  
    setDateType(newValue)
    if (newValue) {  
      typeDate.current  = newValue;   
      fetchProductSeries()

      createEventLog(cookies.get('name')!, '/otomax/product', 'number-product|tab-date-type', 'change', newValue)
    }
  };  


  useEffect(() => {  
    const now = new Date(2025, 2, 29);
    const dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());  
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dateRange = [
      dateStart,
      dateEnd
    ] 
    
    fetchAllData() 

    const interval = setInterval(() => {  
      if (statusReload) { 

      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, statusReload]);
  
  
  function fetchAllData() { 
    fetchProductNumber() 
    fetchProductSeries()
  }

  async function fetchProductNumber() {
    setLoadingProductNumber(true)  
    setLoadingProductCategory(true)  
    setLoadingProductTable(true)  
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
    await fetch('/api/otomax/product/number?start_date='+paramStartDate+'&end_date='+paramEndDate+'&module_type='+typeModule.current).then((response) => {
      if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
      }  
      return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){ 
        setProductNumberData(result['data']) 
        fetchProductCategory(result['data']['omset'], result['data']['margin'])
      } else { 
        toast.error(result['message'])
      }
      setLoadingProductNumber(false) 
    }).catch((error) => { 
      Sentry.captureException(error);
      setLoadingProductNumber(false) 
    });
  }

  async function fetchProductCategory(omset_all: number, margin_all: number) {
    setLoadingProductCategory(true)  
    setLoadingProductTable(true)  
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
    await fetch('/api/otomax/product/category?start_date='+paramStartDate+'&end_date='+paramEndDate+'&module_type='+typeModule.current).then((response) => {
      if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
      }  
      return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){  
        setProductCategoryData(result['data']) 
        setProductTableData(result['data'])

        // chart
        optionsCategoryTemp.xaxis!.categories = []
        seriesCategoryTemp[0]['data'] = []
        seriesCategoryTemp[1]['data'] = []
        seriesCategoryTemp[2]['data'] = []
        rowData = []

        result['data'].forEach((element:CategoryModel )=> { 
          const label = element.category.split(' ')
          optionsCategoryTemp.xaxis?.categories.push(label)
          seriesCategoryTemp[0]['data'].push(element.transaksi)
          seriesCategoryTemp[1]['data'].push(element.omset)
          seriesCategoryTemp[2]['data'].push(element.margin)

          const temp: TableModel = { 
              'category': element.category,
              'transaksi': element.transaksi,
              'omset': element.omset, 
              'margin': element.margin, 
              'omset_percent': 0,
              'margin_percent': 0,
          }

          if (omset_all) { 
            temp.omset_percent = (element.omset / omset_all) * 100
            temp.margin_percent = (element.margin / margin_all) * 100
          }   
          rowData.push(temp)
          
        });  

        setOptionsCategory(optionsCategoryTemp)
        setSeriesCategory(seriesCategoryTemp)
        setProductTableData(rowData)

      } else { 
        toast.error(result['message'])
      }
      setLoadingProductCategory(false) 
      setLoadingProductTable(false)  
    }).catch((error) => { 
      Sentry.captureException(error);
      setLoadingProductCategory(false) 
      setLoadingProductTable(false)  
    });
  }

  async function fetchProductSeries() {
    setLoadingProductTanggal(true)    
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
    await fetch('/api/otomax/product/series?start_date='+paramStartDate+'&end_date='+paramEndDate+'&module_type='+typeModule.current+'&date_type='+typeDate.current).then((response) => {
      if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
      }  
      return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){  
        setProductTanggalData(result['data'])  

        // chart
        optionsTanggalTemp.xaxis!.categories = []
        seriesTanggalTemp[0]['data'] = []
        seriesTanggalTemp[1]['data'] = []
        seriesTanggalTemp[2]['data'] = []

        result['data'].forEach((element:TanggalModel )=> {  
          optionsTanggalTemp.xaxis?.categories.push(element.tanggal)
          seriesTanggalTemp[0]['data'].push(element.transaksi)
          seriesTanggalTemp[1]['data'].push(element.omset)
          seriesTanggalTemp[2]['data'].push(element.margin) 
        });  

        setOptionsTanggal(optionsTanggalTemp)
        setSeriesTanggal(seriesTanggalTemp) 

      } else { 
        toast.error(result['message'])
      }
      setLoadingProductTanggal(false)  
    }).catch((error) => { 
      Sentry.captureException(error);
      setLoadingProductTanggal(false)  
    });
  }

  const [loadingDownload, setLoadingDownload] = useState(false);
  async function actionDownload() {
    try {
      setLoadingDownload(true);  

      const title = 'Product per Category';
      const now = new Date(2025, 10, 21) 
      const dateString = moment(now).format('YYYY.MM.DD HH.mm.ss'); 
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils?.json_to_sheet(productTableData!);
      XLSX.utils.book_append_sheet(workbook, worksheet, title); 
      XLSX.writeFile(workbook, `${title} - ${dateString}.xlsx`); 
      setLoadingDownload(false); 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      setLoadingDownload(false); 
    }
  };

  return ( 
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      
      <div className="block xl:flex justify-end mb-2 ">   
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Angka Produk  
          </h3>  
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Produk per operator
          </p>
        </div>  
  
        <div className="relative">  
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900  ">
            <button
              onClick={() => changeModuleType("ALL")}
              className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white whitespace-nowrap ${getButtonClassModule("ALL")}`}
            >
              Semua
            </button>
            <button
              onClick={() => changeModuleType("H2H")}
              className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white whitespace-nowrap ${getButtonClassModule("H2H")}`}
            >
              H2H
            </button>
            <button
              onClick={() => changeModuleType("RETAIL")}
              className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white whitespace-nowrap ${getButtonClassModule("RETAIL")}`}
            >
              Retail
            </button> 
            <button
              onClick={() => changeModuleType("WEB")}
              className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white whitespace-nowrap ${getButtonClassModule("WEB")}`}
            >
              Web
            </button> 
          </div>
        </div>
      </div>   

      <div className="grid grid-cols-12 gap-4 md:gap-4 mt-4"> 
        
        <div className="col-span-12 xl:col-span-6 space-y-3"> 
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-light-300 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Produk Aktif
              </span> 
            </div> 
            {  
              loadingProductNumber || !productNumberData ?
              (
                <div className="flow lg:flex items-end justify-between">  
                  <div>
                    <div className="flex items-end justify-between mt-2">   
                      <Skeleton height={20} width={100} />
                    </div>
                  </div>  
                  <Skeleton height={20} width={20} />
                </div>
              ) :
              (
                <div className="flow lg:flex items-end justify-between">  
                  <div>   
                    <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                      <NumericFormat displayType="text" value={productNumberData.product_active} thousandSeparator="." decimalSeparator=","/> 
                      &nbsp;/&nbsp;
                      <NumericFormat displayType="text" value={productNumberData.product_all} thousandSeparator="." decimalSeparator=","/> 
                    </h4> 
                  </div> 
                  <div>
                    <Badge color="success"> 
                      <NumericFormat displayType="text" value={productNumberData?.product_active_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                    </Badge> dari semua produk
                  </div>  
                </div>
              )
            }
          </div>
        </div>

        <div className="col-span-12 xl:col-span-6 space-y-3"> 
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-yellow-300 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Angka Transaksi
              </span> 
            </div> 
            {  
              loadingProductNumber || !productNumberData ?
              (
                <div className="flow lg:flex items-end justify-between">  
                  <div>
                    <div className="flex items-end justify-between mt-2">   
                      <Skeleton height={20} width={100} />
                    </div>
                  </div>  
                  <Skeleton height={20} width={20} />
                </div>
              ) :
              (
                <div className="flow lg:flex items-end justify-between">  
                  <div>   
                    <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                      <NumericFormat displayType="text" value={productNumberData.transaksi} thousandSeparator="." decimalSeparator=","/>
                    </h4> 
                  </div> 
                </div>
              )
            }
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5 space-y-3"> 
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-300 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Nilai Omset
              </span> 
            </div> 
            { 
              loadingProductNumber || !productNumberData ?
              (
                <div className="flow lg:flex items-end justify-between">  
                  <div>
                    <div className="flex items-end justify-between mt-2">   
                      <Skeleton height={20} width={100} />
                    </div>
                  </div>  
                  <Skeleton height={20} width={20} />
                </div>
              ) :
              (
                <div className="flow lg:flex items-end justify-between">  
                  <div>   
                    <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                      <NumericFormat displayType="text" value={productNumberData.omset} thousandSeparator="." decimalSeparator="," prefix="Rp. "/>
                    </h4> 
                  </div> 
                </div>
              )
            }
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5 space-y-3"> 
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-300 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Nilai Margin
              </span> 
            </div> 
            { 
              loadingProductNumber || !productNumberData ?
              (
                <div className="flow lg:flex items-end justify-between">  
                  <div>
                    <div className="flex items-end justify-between mt-2">   
                      <Skeleton height={20} width={100} />
                    </div>
                  </div>  
                  <Skeleton height={20} width={20} />
                </div>
              ) :
              (
                <div className="flow lg:flex items-end justify-between">  
                  <div>   
                    <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                      <NumericFormat displayType="text" value={productNumberData.margin} thousandSeparator="." decimalSeparator="," prefix="Rp. "/>
                    </h4> 
                  </div> 
                </div>
              )
            }
          </div>
        </div>

        <div className="col-span-12 xl:col-span-2 space-y-3"> 
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-light-300 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Rate
              </span> 
            </div> 
            { 
              loadingProductNumber || !productNumberData ?
              (
                <div className="flow lg:flex items-end justify-between">  
                  <div>
                    <div className="flex items-end justify-between mt-2">   
                      <Skeleton height={20} width={100} />
                    </div>
                  </div>  
                  <Skeleton height={20} width={20} />
                </div>
              ) :
              (
                <div className="flow lg:flex items-end justify-between">  
                  <div>   
                    <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                      <NumericFormat displayType="text" value={(productNumberData.margin/productNumberData.omset)*100} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> %
                    </h4> 
                  </div> 
                </div>
              )
            }
          </div>
        </div>

      </div>

      <div className="block w-full mt-4 mb-4"> 
        { 
          loadingProductCategory || !productCategoryData ? 
          ( 
            <div >  
              <Skeleton height={50}  className="min-w-full w-full p-2"/>  
              &nbsp;
              <Skeleton height={50}  className="min-w-full w-full p-2"/>  
              &nbsp;
              <Skeleton height={50}  className="min-w-full w-full p-2"/>  
            </div>
          ) :
          (
            <div>
               <ReactApexChart
                  options={optionsCategory}
                  series={seriesCategory}
                  type="bar"
                  height={300}
                />  
            </div>
          )
        }
      </div>

      <div className="block w-full mt-4">  
        {
          loadingProductTable || !productTableData ? 
          (
            <div>
              <Skeleton height={400} className=""/>  
              <br/>
            </div>
          ) :
          ( 
            <div style={{ width: "100%", height: "400px" }}>
              <button onClick={() => actionDownload()} className="mb-2 inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-green-500 shadow-theme-xs hover:bg-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0 0 26 26" fill="#FFF">
                  <path d="M 15 0 L 0 2.875 L 0 23.125 L 15 26 Z M 16 3 L 16 5.96875 L 19.03125 5.96875 L 19.03125 8 L 16 8 L 16 10 L 19 10 L 19 12 L 16 12 L 16 14 L 19 14 L 19 16 L 16 16 L 16 18 L 19 18 L 19 20 L 16 20 L 16 23 L 25.15625 23 C 25.617188 23 26 22.605469 26 22.125 L 26 3.875 C 26 3.394531 25.617188 3 25.15625 3 Z M 20 6 L 24 6 L 24 8 L 20 8 Z M 3.09375 7.9375 L 5.84375 7.9375 L 7.3125 11 C 7.425781 11.238281 7.535156 11.515625 7.625 11.84375 C 7.683594 11.644531 7.8125 11.359375 7.96875 10.96875 L 9.5625 7.9375 L 12.09375 7.9375 L 9.0625 12.96875 L 12.1875 18.09375 L 9.5 18.09375 L 7.75 14.78125 C 7.683594 14.660156 7.601563 14.421875 7.53125 14.09375 L 7.5 14.09375 C 7.46875 14.25 7.402344 14.496094 7.28125 14.8125 L 5.53125 18.09375 L 2.8125 18.09375 L 6.03125 13.03125 Z M 20 10 L 24 10 L 24 12 L 20 12 Z M 20 14 L 24 14 L 24 16 L 20 16 Z M 20 18 L 24 18 L 24 20 L 20 20 Z"></path>
                </svg>
                {loadingDownload ? "Loading..." : "Export Excel"}
              </button>

              <AgGridReact
                  rowData={productTableData}
                  columnDefs={colDefs} 
              /> 
            </div>
          )
        }  
      </div>
       
      <div className="block w-full mt-4 pt-6"> 
        <div className="flex flex-col gap-5 mt-6 sm:flex-row sm:justify-between">  
          <div className="w-full">  
          </div>  
          <div className="block xl:flex justify-between mb-2 ">   
            <div className="relative">  
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900  ">
                <button
                  onClick={() => changeDateType("DAY")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClassDate("DAY")}`}
                >
                  Harian
                </button>
                <button
                  onClick={() => changeDateType("WEEK")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClassDate("WEEK")}`}
                >
                  Mingguan
                </button>
                <button
                  onClick={() => changeDateType("MONTH")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClassDate("MONTH")}`}
                >
                  Bulanan
                </button>
              </div>
            </div>
          </div> 
        </div> 
      </div>
      
      <div className="max-w-full ">   
        { 
          loadingProductTanggal || !productTanggalData ? 
          ( 
            <div >  
              <Skeleton height={50}  className="min-w-full w-full p-2"/>  
              &nbsp;
              <Skeleton height={50}  className="min-w-full w-full p-2"/>  
              &nbsp;
              <Skeleton height={50}  className="min-w-full w-full p-2"/>  
            </div>
          ) :
          (  
            <ReactApexChart
              options={optionsTanggal}
              series={seriesTanggal}
              type="bar"
              height={400}
            />  
          )
        }
      </div>  

    </div>
  );

}

