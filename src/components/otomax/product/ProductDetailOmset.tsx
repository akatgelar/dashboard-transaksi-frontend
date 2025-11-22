'use client'

import { useEffect, useRef, useState } from "react";
import { LineIconCheckCircle } from "@/icons/line-icon";  
import { ApexOptions } from "apexcharts";    
import moment from "moment";
import toast from "react-hot-toast";
import * as Sentry from "@sentry/browser";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css' 
import dynamic from "next/dynamic";  
import { NumericFormat } from "react-number-format";
import Badge from "../../ui/badge/Badge"; 
import { createEventLog } from "@/utils/log";
import { useCookies } from 'next-client-cookies';
import { AllCommunityModule, ColDef, ModuleRegistry, ValueFormatterParams, TextFilterModule } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; 
import * as XLSX from "xlsx";
 
ModuleRegistry.registerModules([AllCommunityModule, TextFilterModule]);

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
}); 
 

export interface BigNumberModel {
  omset_all: number; 
  product_active: number;
  omset_per_product: number;
  omset_h2h: number;
  omset_h2h_percent: number;
  omset_retail: number;
  omset_retail_percent: number;
  omset_website: number;
  omset_website_percent: number; 
}

export interface SeriesDataModel { 
  date: string,
  h2h: number, 
  retail: number, 
  web: number, 
};

export interface SeriesModel { 
  name: string,
  data: number[], 
};

export interface ParamProps {
  statusReload: boolean; 
  dateRange: [Date, Date]; 
  productType: string;
}

export default function ProductDetailOmset({statusReload, dateRange, productType}:ParamProps) { 
     
  const cookies = useCookies();

  const [loadingDataBigNumber, setLoadingDataBigNumber] = useState(true);
  const [DataBigNumberData, setDataBigNumberData] = useState<BigNumberModel>()
  
  const options: ApexOptions = {
    colors: ["#00c950", "#7af2a8", "#dcfce6"],
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
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
      stacked: true,
      events: {
        dataPointMouseEnter: function (event, chartContext, opts) { 
          const value = {
            'xaxis': opts['w']['config']['xaxis']['categories'][opts.dataPointIndex],
            'yaxis': opts['w']['config']['series'][opts.seriesIndex]['data'][opts.dataPointIndex],
            'zaxis': opts['w']['config']['series'][opts.seriesIndex]['name']
          }
          createEventLog(cookies.get('name')!, '/otomax/product', 'omset|barchart', 'hover', JSON.stringify(value))
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
    yaxis: {
      title: {
        text: "",
      },
      labels: { 
        formatter: function(value) {
          return "Rp." + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
        }
      }
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
      'name': 'H2H',
      'data': []
    },
    { 
      'name': 'Retail',
      'data': []
    },
    { 
      'name': 'Website',
      'data': []
    },
  ];

  const [loadingDataSeries, setLoadingDataSeries] = useState(true);
  const [DataSeriesData, setDataSeriesData] = useState<SeriesModel>()

  const [optionDataLine, setOptionDataLine] = useState<ApexOptions>(options)
  const [seriesDataLine, setSeriesDataLine] = useState<SeriesModel[]>(series)
  
  // table
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const column:any = [];
  const data:any = []
  const defaultColDef: ColDef = {
    flex: 1,
  };
  const [loadingDataDetail, setLoadingDataDetail] = useState(true); 
  const [columnTable, setColumnTable] = useState<any[]>(column)
  const [dataTable, setDataTable] = useState<any[]>(data)
  
  const typeDate = useRef('DAY')
  const [dateType, setDateType] = useState<string>("DAY"); 
  const getButtonClass = (option: "MONTH"|"WEEK"|"DAY") => 
    dateType === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  
  const changeDateType = (newValue: string) => {  
    setDateType(newValue)
    if (newValue) {  
      typeDate.current  = newValue; 
      fetchDataSeries()  
      fetchProductDetail()  

      createEventLog(cookies.get('name')!, '/otomax/product', 'omset|tab-date-type', 'change', newValue)
    }
  }; 

  const typeLevel = useRef('ALL')
  const [levelType, setLevelType] = useState<string>("ALL"); 
  const getButtonClassLevel = (option: "ALL" | "H2H" | "RETAIL" | "WEBSITE") =>
    levelType === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";
  
  const changeLevelType = (newValue: string) => { 
    setLevelType(newValue)
    if (newValue) {  
      typeLevel.current  = newValue; 
      fetchProductDetail()

      createEventLog(cookies.get('name')!, '/otomax/product', 'omset|tab-level-type', 'change', newValue)
    }
  };  

  useEffect(() => { 
    fetchAllData()

    const interval = setInterval(() => { 
      if (statusReload) {
        fetchDataBigNumber() 
        fetchDataSeries()  
        fetchProductDetail() 
        } 
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusReload, dateRange, productType])


	const fetchAllData = async () => {   
    fetchDataBigNumber()  
    fetchDataSeries()  
    fetchProductDetail()  
  };
 

  async function fetchDataBigNumber() {
    setLoadingDataBigNumber(true)  
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
    const paramProductType = productType
    await fetch('/api/otomax/product/big-number-omset?start_date='+paramStartDate+'&end_date='+paramEndDate+'&product_type='+paramProductType).then((response) => {
      if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
      }  
      return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){ 
        setDataBigNumberData(result['data'])
      } else { 
        toast.error(result['message'])
      }
      setLoadingDataBigNumber(false) 
    }).catch((error) => { 
      Sentry.captureException(error);
      setLoadingDataBigNumber(false) 
    });
  }
  
  async function fetchDataSeries() {
    setLoadingDataSeries(true)   
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
    const paramProductType = productType
		await fetch('/api/otomax/product/series-omset?start_date='+paramStartDate+'&end_date='+paramEndDate+'&product_type='+paramProductType+'&date_type='+typeDate.current).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){   
        setDataSeriesData(result['data'])

        // clear data
        series[0]['data'] = []
        series[1]['data'] = []
        series[2]['data'] = []
        options.xaxis!.categories = []

        result['data'].forEach((element: SeriesDataModel)=> {  
          options.xaxis?.categories.push(element.date)  
          series[0]['data'].push(element.h2h)
          series[1]['data'].push(element.retail)
          series[2]['data'].push(element.web)
        }); 
        setOptionDataLine(options)  
        setSeriesDataLine(series) 
			} else { 
        toast.error(result["message"])
      }
      setLoadingDataSeries(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingDataSeries(false) 
		});
  }

  async function fetchProductDetail() {
    setLoadingDataDetail(true)
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')     
    const paramProductType = productType
		await fetch('/api/otomax/product/detail-omset?start_date='+paramStartDate+'&end_date='+paramEndDate+'&product_type='+paramProductType+'&date_type='+typeDate.current+'&level_type='+typeLevel.current).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){   
        if (result["data"] != null) {
          const tempColumn:any = []
          tempColumn.push({field: 'name',headerName: 'Product', minWidth: 200, filter: true, pinned: 'left'});
          Object.keys(result["data"][0]).forEach(function (key) {
            if (key != 'name') {
              tempColumn.push({
                field: key, 
                minWidth: 150, 
                valueFormatter: currencyFormatter, 
                type: 'rightAligned'
              });
            }
          });
          setColumnTable(tempColumn)
          setDataTable(result["data"])
        } else {
          setColumnTable([])
          setDataTable([])
        }
			} else { 
        setColumnTable([])
        setDataTable([])
        toast.error(result["message"])
      }
      setLoadingDataDetail(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingDataDetail(false) 
		});
  }

  const [loadingDownload, setLoadingDownload] = useState(false);
  async function actionDownload() {
    try {
      setLoadingDownload(true);  

      const title = 'Product Omset';
      const now = new Date(2025, 10, 21) 
      const dateString = moment(now).format('YYYY.MM.DD HH.mm.ss'); 
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils?.json_to_sheet(dataTable!);
      XLSX.utils.book_append_sheet(workbook, worksheet, title); 
      XLSX.writeFile(workbook, `${title} - ${dateString}.xlsx`); 
      setLoadingDownload(false); 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      setLoadingDownload(false); 
    }
  };

  function currencyFormatter(params: ValueFormatterParams) {
    return params.value == null ? "" : "Rp. " + params.value.toLocaleString().replace(/,/g, '.');
  }
    
  
  return ( 

    <div className="">
        
        {/* big number product */}
        <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Omset
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Nilai omset dibandingan dengan product
            </p>
          </div>  
          <div className="block xl:flex justify-between mb-2 ">  
            <div className="relative mr-2">   
            </div>   
            <div className="relative">  
              
            </div>
          </div>  
        </div>

        {/* big number omset */}
        <div className="grid grid-cols-12 gap-4 md:gap-4"> 

          {/* number omset */} 
          <div className="col-span-12 xl:col-span-4 space-y-3"> 
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-light-100 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Total Omset
                </span> 
              </div> 
              { 
                loadingDataBigNumber || !DataBigNumberData ?
                (
                  <div className="flow lg:flex items-end justify-between">  
                    <div>
                      <div className="flex items-end justify-between mt-2">  
                        <Skeleton height={20} width={100} className=""/>  
                      </div>
                    </div>  
                    <Skeleton height={20} width={20} />
                  </div>
                ) :
                (
                  <div className="flow lg:flex items-end justify-between">  
                    <div>   
                      <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                        <NumericFormat displayType="text" value={DataBigNumberData.omset_all} thousandSeparator="." decimalSeparator="," prefix="Rp. "/>
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
                <div className="flex items-center justify-center w-10 h-10 bg-light-100 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Product Active
                </span> 
              </div> 
              { 
                loadingDataBigNumber || !DataBigNumberData ?
                (
                  <div className="flow lg:flex items-end justify-between">  
                    <div>
                      <div className="flex items-end justify-between mt-2">  
                        <Skeleton height={20} width={100} className=""/>  
                      </div>
                    </div>  
                    <Skeleton height={20} width={20} />
                  </div>
                ) :
                (
                  <div className="flow lg:flex items-end justify-between">  
                    <div>   
                      <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                        <NumericFormat displayType="text" value={DataBigNumberData.product_active} thousandSeparator="." decimalSeparator="," decimalScale={0}/>
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
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                   Rata-rata Omset per Product
                </span> 
              </div> 
              { 
                loadingDataBigNumber || !DataBigNumberData ?
                (
                  <div className="flow lg:flex items-end justify-between">  
                    <div>
                      <div className="flex items-end justify-between mt-2">  
                        <Skeleton height={20} width={100} className=""/>  
                      </div>
                    </div>  
                    <Skeleton height={20} width={20} />
                  </div>
                ) :
                (
                  <div className="flow lg:flex items-end justify-between">  
                    <div>   
                      <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                        <NumericFormat displayType="text" value={DataBigNumberData.omset_per_product} thousandSeparator="." decimalSeparator="," decimalScale={0} prefix="Rp. "/>
                      </h4> 
                    </div> 
                  </div>
                )
              }  
            </div>
          </div>  
  
          <div className="col-span-12 xl:col-span-6 space-y-3"> 
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Omset H2H
                </span> 
              </div> 
              { 
                loadingDataBigNumber || !DataBigNumberData ?
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
                        <NumericFormat displayType="text" value={DataBigNumberData.omset_h2h} thousandSeparator="." decimalSeparator="," prefix="Rp. "/>
                      </h4> 
                    </div>
                    {
                      DataBigNumberData?.omset_h2h_percent > 0 ? 
                      ( 
                        <div className="flex">
                          <Badge color="success"> 
                            <NumericFormat displayType="text" value={DataBigNumberData?.omset_h2h_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> %  
                          </Badge> 
                          <div className="leading-none ml-2">
                            dari <br/>omset <br/>total
                          </div> 
                        </div>
                      ) : 
                      (
                        DataBigNumberData?.omset_h2h_percent < 0 ? 
                        (
                          <div className="flex">
                            <Badge color="error"> 
                              <NumericFormat displayType="text" value={DataBigNumberData?.omset_h2h_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> %  
                            </Badge> 
                            <div className="leading-none ml-2">
                              dari <br/>omset <br/>total
                            </div>  
                          </div>
                        ) :
                        (
                          <div className="flex">
                            <Badge color="light"> 
                              <NumericFormat displayType="text" value={DataBigNumberData?.omset_h2h_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> %  
                            </Badge>
                            <div className="leading-none ml-2">
                              dari <br/>omset <br/>total
                            </div> 
                          </div>
                        )
                      )
                    } 
                  </div>
                )
              }
            </div>
          </div>

          <div className="col-span-12 xl:col-span-6 space-y-3"> 
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Omset Retail
                </span> 
              </div> 
              { 
                loadingDataBigNumber || !DataBigNumberData ?
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
                        <NumericFormat displayType="text" value={DataBigNumberData.omset_retail} thousandSeparator="." decimalSeparator="," prefix="Rp. "/>
                      </h4> 
                    </div>
                    {
                      DataBigNumberData?.omset_retail_percent > 0 ? 
                      ( 
                        <div className="flex">
                          <Badge color="success"> 
                            <NumericFormat displayType="text" value={DataBigNumberData?.omset_retail_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> %  
                          </Badge> 
                          <div className="leading-none ml-2">
                            dari <br/>omset <br/>total
                          </div> 
                        </div>
                      ) : 
                      (
                        DataBigNumberData?.omset_retail_percent < 0 ? 
                        (
                          <div className="flex">
                            <Badge color="error"> 
                              <NumericFormat displayType="text" value={DataBigNumberData?.omset_retail_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> %  
                            </Badge> 
                            <div className="leading-none ml-2">
                              dari <br/>omset <br/>total
                            </div> 
                          </div>
                        ) :
                        (
                          <div className="flex">
                            <Badge color="light"> 
                              <NumericFormat displayType="text" value={DataBigNumberData?.omset_retail_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> %  
                            </Badge> 
                            <div className="leading-none ml-2">
                              dari <br/>omset <br/>total
                            </div> 
                          </div>
                        )
                      )
                    } 
                  </div>
                )
              }
            </div>
          </div>

          <div className="col-span-12 xl:col-span-6 space-y-3"> 
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-300 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Omset Website
                </span> 
              </div> 
              { 
                loadingDataBigNumber || !DataBigNumberData ?
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
                        <NumericFormat displayType="text" value={DataBigNumberData.omset_website} thousandSeparator="." decimalSeparator="," prefix="Rp. "/>
                      </h4> 
                    </div>
                    {
                      DataBigNumberData?.omset_website_percent > 0 ? 
                      ( 
                        <div className="flex">
                          <Badge color="success"> 
                            <NumericFormat displayType="text" value={DataBigNumberData?.omset_website_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> %  
                          </Badge>
                          <div className="leading-none ml-2">
                            dari <br/>omset <br/>total
                          </div> 
                        </div>
                      ) : 
                      (
                        DataBigNumberData?.omset_website_percent < 0 ? 
                        (
                          <div className="flex">
                            <Badge color="error"> 
                              <NumericFormat displayType="text" value={DataBigNumberData?.omset_website_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> %  
                            </Badge> 
                            <div className="leading-none ml-2">
                              dari <br/>omset <br/>total
                            </div> 
                          </div>
                        ) :
                        (
                          <div className="flex">
                            <Badge color="light"> 
                              <NumericFormat displayType="text" value={DataBigNumberData?.omset_website_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> %  
                            </Badge> 
                            <div className="leading-none ml-2">
                              dari <br/>omset <br/>total
                            </div> 
                          </div>
                        )
                      )
                    } 
                  </div>
                )
              }
            </div>
          </div>

        </div>

        {/* line chart */}
        <div className="flex flex-col gap-5 mt-6 sm:flex-row sm:justify-between">
          <div className="w-full"> 
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Angka omset per waktu
            </p>
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
            loadingDataSeries || !DataSeriesData ?
            (
              <div>
                <Skeleton height={200}   className=""/>  
                <br/>
              </div>
            ) :
            (
              <div>
                <ReactApexChart
                  options={optionDataLine}
                  series={seriesDataLine}
                  type="bar"
                  height={300}
                />
              </div>
              
            )
          }  
        </div>

        {/* table */}
        <div className="flex flex-col gap-5 mt-6 sm:flex-row sm:justify-between">
          <div className="w-full">    
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400"> 
                <button onClick={() => actionDownload()} className="mb-2 inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-green-500 shadow-theme-xs hover:bg-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0 0 26 26" fill="#FFF">
                    <path d="M 15 0 L 0 2.875 L 0 23.125 L 15 26 Z M 16 3 L 16 5.96875 L 19.03125 5.96875 L 19.03125 8 L 16 8 L 16 10 L 19 10 L 19 12 L 16 12 L 16 14 L 19 14 L 19 16 L 16 16 L 16 18 L 19 18 L 19 20 L 16 20 L 16 23 L 25.15625 23 C 25.617188 23 26 22.605469 26 22.125 L 26 3.875 C 26 3.394531 25.617188 3 25.15625 3 Z M 20 6 L 24 6 L 24 8 L 20 8 Z M 3.09375 7.9375 L 5.84375 7.9375 L 7.3125 11 C 7.425781 11.238281 7.535156 11.515625 7.625 11.84375 C 7.683594 11.644531 7.8125 11.359375 7.96875 10.96875 L 9.5625 7.9375 L 12.09375 7.9375 L 9.0625 12.96875 L 12.1875 18.09375 L 9.5 18.09375 L 7.75 14.78125 C 7.683594 14.660156 7.601563 14.421875 7.53125 14.09375 L 7.5 14.09375 C 7.46875 14.25 7.402344 14.496094 7.28125 14.8125 L 5.53125 18.09375 L 2.8125 18.09375 L 6.03125 13.03125 Z M 20 10 L 24 10 L 24 12 L 20 12 Z M 20 14 L 24 14 L 24 16 L 20 16 Z M 20 18 L 24 18 L 24 20 L 20 20 Z"></path>
                  </svg>
                  {loadingDownload ? "Loading..." : "Export Excel"}
                </button>
            </p>
          </div>
          <div className="block xl:flex float-right mb-2 ">   
            <div className="relative">  
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900  ">
                <button
                  onClick={() => changeLevelType("ALL")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white whitespace-nowrap ${getButtonClassLevel("ALL")}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => changeLevelType("H2H")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white whitespace-nowrap ${getButtonClassLevel("H2H")}`}
                >
                  H2H
                </button>
                <button
                  onClick={() => changeLevelType("WEBSITE")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white whitespace-nowrap ${getButtonClassLevel("WEBSITE")}`}
                >
                  Web
                </button> 
                <button
                  onClick={() => changeLevelType("RETAIL")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white whitespace-nowrap ${getButtonClassLevel("RETAIL")}`}
                >
                  Retail
                </button> 
              </div>
            </div>
          </div>   
        </div>
    
        <div className="max-w-full overflow-x-auto custom-scrollbar mb-6">  
          {
            loadingDataDetail ?
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
              <div style={{ width: "100%", height: "500px" }}>
                <AgGridReact
                    rowData={dataTable}
                    columnDefs={columnTable}
                    defaultColDef={defaultColDef}
                /> 
              </div> 
            )
          } 
        </div>
        
    </div>
      
  );

}
