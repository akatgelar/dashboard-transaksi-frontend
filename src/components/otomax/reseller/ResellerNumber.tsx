'use client'

import { useEffect, useRef, useState } from "react";
import { LineIconCheckCircle } from "@/icons/line-icon";  
import { NumericFormat } from "react-number-format";
import Badge from "../../ui/badge/Badge";  
import moment from "moment";
import toast from "react-hot-toast";
import * as Sentry from "@sentry/browser";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css' 
import { ApexOptions } from "apexcharts";    
import dynamic from "next/dynamic";
import { createEventLog } from "@/utils/log";
import { useCookies } from 'next-client-cookies';

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
}); 


export interface BigNumberModel {
  reseller_all: number;
  reseller_active: number;
  reseller_active_percent: number;
  reseller_active_h2h: number;
  reseller_active_h2h_percent: number;
  reseller_active_retail: number;
  reseller_active_retail_percent: number;
  reseller_active_website: number;
  reseller_active_website_percent: number; 
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
}
 


export default function ResellerNumber({statusReload, dateRange}:ParamProps) { 
   
  const [dateType, setDateType] = useState<string>("DAY"); 
  const typeDate = useRef('DAY')

  // const [levelType, setLevelType] = useState<string>("ALL"); 
  // const typeLevel = useRef('ALL')

  const cookies = useCookies();
   
  const options: ApexOptions = {
    colors: ["#fa2c37", "#ffa2a3", "#ffe2e1"],
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
          createEventLog(cookies.get('name')!, '/otomax/reseller', 'number|barchart', 'hover', JSON.stringify(value))
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
          return value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
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
      'name': 'Website',
      'data': []
    },
    { 
      'name': 'Retail',
      'data': []
    },
  ];

  const [loadingResellerBigNumber, setLoadingResellerBigNumber] = useState(true);
  const [resellerBigNumberData, setResellerBigNumberData] = useState<BigNumberModel>()
   
  const [loadingResellerSeries, setLoadingResellerSeries] = useState(true);
  const [resellerSeriesData, setResellerSeriesData] = useState<SeriesModel>()
 
  const [optionData, setOptionData] = useState<ApexOptions>(options)
  const [seriesData, setSeriesData] = useState<SeriesModel[]>(series)
  
  const getButtonClass = (option: "MONTH"|"WEEK"|"DAY") => 
    dateType === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  const changeDateType = (newValue: string) => {  
    setDateType(newValue)
    if (newValue) {  
      typeDate.current  = newValue; 
      fetchResellerSeries()  

      createEventLog(cookies.get('name')!, '/otomax/reseller', 'number|tab-date-type', 'change', newValue)
    }
  };  

  // const getButtonClassLevel = (option: "ALL" | "H2H" | "RETAIL" | "WEBSITE") =>
  //   levelType === option
  //     ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
  //     : "text-gray-500 dark:text-gray-400";
  

  // const changeLevelType = (newValue: string) => { 
  //   setLevelType(newValue)
  //   if (newValue) {  
  //     typeLevel.current  = newValue;
  //     fetchResellerBigNumber()
  //     fetchResellerSeries()  

  //     createEventLog(cookies.get('name')!, '/otomax/reseller', 'number|tab-level-type', 'change', newValue)
  //   }
  // };  

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
        fetchResellerBigNumber() 
        fetchResellerSeries()
      } 
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, statusReload]);


	const fetchAllData = async () => {   
    fetchResellerBigNumber()
    fetchResellerSeries()
  };
 
  async function fetchResellerBigNumber() {
    setLoadingResellerBigNumber(true)  
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
		await fetch('/api/otomax/reseller/big-number?start_date='+paramStartDate+'&end_date='+paramEndDate).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){ 
				setResellerBigNumberData(result['data'])
			} else { 
        toast.error(result['message'])
      }
      setLoadingResellerBigNumber(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingResellerBigNumber(false) 
		});
  }

  async function fetchResellerSeries() {
    setLoadingResellerSeries(true)   
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
		await fetch('/api/otomax/reseller/series?start_date='+paramStartDate+'&end_date='+paramEndDate+'&date_type='+typeDate.current).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){   
        setResellerSeriesData(result['data'])

        // clear data
        series[0]['data'] = []
        series[1]['data'] = []
        series[2]['data'] = []
        options.xaxis!.categories = []

        result['data'].forEach((element: SeriesDataModel)=> {  
          options.xaxis?.categories.push(element.date) 
          series[0]['data'].push(element.h2h)
          series[1]['data'].push(element.web)
          series[2]['data'].push(element.retail)
        }); 
        setOptionData(options) 
        
        setSeriesData(series) 
			} else { 
        toast.error(result["message"])
      }
      setLoadingResellerSeries(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingResellerSeries(false) 
		});
  }
  
  return ( 
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
  
        {/* calendar */}
        <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Angka Reseller 
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Angka reseller aktif
            </p>
          </div>  
          {/* <div className="block xl:flex justify-between mb-2 ">   
            <div className="relative mr-2"> 
            </div>  
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
                  onClick={() => changeLevelType("RETAIL")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white whitespace-nowrap ${getButtonClassLevel("RETAIL")}`}
                >
                  Retail
                </button> 
                <button
                  onClick={() => changeLevelType("WEBSITE")}
                  className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white whitespace-nowrap ${getButtonClassLevel("WEBSITE")}`}
                >
                  Web
                </button> 
              </div>
            </div>
          </div>   */}
        </div>

        {/* row 1 */}
        <div className="grid grid-cols-12 gap-4 md:gap-4"> 

          <div className="col-span-12 xl:col-span-6 space-y-3"> 
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-light-100 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Reseller Aktif
                </span> 
              </div> 
              { 
                loadingResellerBigNumber || !resellerBigNumberData ?
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
                        <NumericFormat displayType="text" value={resellerBigNumberData.reseller_active} thousandSeparator="." decimalSeparator=","/>
                      </h4> 
                    </div>
                    {
                      resellerBigNumberData?.reseller_active_percent > 0 ? 
                      ( 
                        <div>
                          <Badge color="success"> 
                            <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge> dari reseller total
                        </div>
                      ) : 
                      (
                        resellerBigNumberData?.reseller_active_percent < 0 ? 
                        (
                          <div>
                            <Badge color="error"> 
                              <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                            </Badge> dari reseller total
                          </div>
                        ) :
                        (
                          <div>
                            <Badge color="light"> 
                              <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                            </Badge> dari reseller total
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
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Reseller Total
                </span> 
              </div> 
              { 
                loadingResellerBigNumber || !resellerBigNumberData ?
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
                        <NumericFormat displayType="text" value={resellerBigNumberData.reseller_all} thousandSeparator="." decimalSeparator=","/> 
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
                <div className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Reseller H2H
                </span> 
              </div> 
              { 
                loadingResellerBigNumber || !resellerBigNumberData ?
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
                        <NumericFormat displayType="text" value={resellerBigNumberData.reseller_active_h2h} thousandSeparator="." decimalSeparator=","/>
                      </h4> 
                    </div>
                    {
                      resellerBigNumberData?.reseller_active_h2h_percent > 0 ? 
                      ( 
                        <div>
                          <Badge color="success"> 
                            <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_h2h_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge> dari reseller aktif
                        </div>
                      ) : 
                      (
                        resellerBigNumberData?.reseller_active_h2h_percent < 0 ? 
                        (
                          <div>
                            <Badge color="error"> 
                              <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_h2h_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                            </Badge> dari reseller aktif
                          </div>
                        ) :
                        (
                          <div>
                            <Badge color="light"> 
                              <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_h2h_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                            </Badge> dari reseller aktif
                          </div>
                        )
                      )
                    } 
                  </div>
                )
              }
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 space-y-3"> 
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-red-300 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Reseller Website
                </span> 
              </div> 
              { 
                loadingResellerBigNumber || !resellerBigNumberData ?
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
                        <NumericFormat displayType="text" value={resellerBigNumberData.reseller_active_website} thousandSeparator="." decimalSeparator=","/>
                      </h4> 
                    </div>
                    {
                      resellerBigNumberData?.reseller_active_website_percent > 0 ? 
                      ( 
                        <div>
                          <Badge color="success"> 
                            <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_website_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge> dari reseller aktif
                        </div>
                      ) : 
                      (
                        resellerBigNumberData?.reseller_active_website_percent < 0 ? 
                        (
                          <div>
                            <Badge color="error"> 
                              <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_website_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                            </Badge> dari reseller aktif
                          </div>
                        ) :
                        (
                          <div>
                            <Badge color="light"> 
                              <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_website_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                            </Badge> dari reseller aktif
                          </div>
                        )
                      )
                    } 
                  </div>
                )
              }
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 space-y-3"> 
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Reseller Retail
                </span> 
              </div> 
              { 
                loadingResellerBigNumber || !resellerBigNumberData ?
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
                        <NumericFormat displayType="text" value={resellerBigNumberData.reseller_active_retail} thousandSeparator="." decimalSeparator=","/>
                      </h4> 
                    </div>
                    {
                      resellerBigNumberData?.reseller_active_retail_percent > 0 ? 
                      ( 
                        <div>
                          <Badge color="success"> 
                            <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_retail_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge> dari reseller aktif
                        </div>
                      ) : 
                      (
                        resellerBigNumberData?.reseller_active_retail_percent < 0 ? 
                        (
                          <div>
                            <Badge color="error"> 
                              <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_retail_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                            </Badge> dari reseller aktif
                          </div>
                        ) :
                        (
                          <div>
                            <Badge color="light"> 
                              <NumericFormat displayType="text" value={resellerBigNumberData?.reseller_active_retail_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                            </Badge> dari reseller aktif
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
              Reseller aktif per waktu
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
            loadingResellerSeries || !resellerSeriesData ?
            (
              <div>
                <Skeleton height={200}   className=""/>  
                <br/>
              </div>
            ) :
            (
              <div>
                <ReactApexChart
                  options={optionData}
                  series={seriesData}
                  type="bar"
                  height={300}
                />
              </div>
              
            )
          }  
        </div>
      </div>

  );

}

