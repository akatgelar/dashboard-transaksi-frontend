"use client";
import React, { useEffect, useRef, useState } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";     
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css'
import moment from "moment";
import toast from "react-hot-toast"; 
import * as Sentry from "@sentry/browser";
import { LineIconCheckCircle } from "@/icons/line-icon"; 
import { createEventLog } from "@/utils/log";
import { useCookies } from 'next-client-cookies';
import { NumericFormat } from "react-number-format";
import Badge from "../../ui/badge/Badge"; 

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
}); 


export interface BigNumberModel {
  modul_active: number;
  modul_active_percent: number;
  modul_active_stok_luar: number;
  modul_active_stok_luar_percent: number;
  modul_active_stok_sendiri: number;
  modul_active_stok_sendiri_percent: number;
  modul_all: number;
}

export interface SeriesDataModel { 
  date: string,
  stok_sendiri: number, 
  stok_luar: number, 
};

export interface SeriesModel { 
  name: string,
  data: number[], 
};

export interface StatusProps {
  statusReload: boolean;
  dateRange: [Date, Date]; 
}
  
  
export default function ModulBigNumber({statusReload, dateRange}:StatusProps) {   
 
  const typeDate = useRef('DAY')
  const [dateType, setDateType] = useState<string>("DAY");
  // const [moduleType, setModuleType] = useState<string>("ALL");
  
  const cookies = useCookies();

  // chart
  const options: ApexOptions = {
    colors: ["#e50146", "#FDAB9E"],
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
          createEventLog(cookies.get('name')!, '/otomax/modul', 'transaksi|barchart', 'hover', JSON.stringify(value))
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
  const series = [
    {
      name: 'Stok Sendiri',
      data: [] as number[]
    }, {
      name: 'Stok Luar',
      data: [] as number[]
    }, 
  ]; 

  const [loadingDataBigNumber, setLoadingDataBigNumber] = useState(true);
  const [dataBigNumber, setDataBigNumber] = useState<BigNumberModel>();
 
  const [loadingDataSeries, setLoadingDataSeries] = useState(true);
  const [dataSeries, setDataSeries] = useState<SeriesDataModel>();

  const [seriesData, setSeriesData] = useState<SeriesModel[]>(series)
  const [optionData, setOptionData] = useState<ApexOptions>(options)
 
  // tab 
  const getButtonClass = (option: "MONTH"|"WEEK"|"DAY") =>
    dateType === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";
 
  const changeDateType = (newValue: string) => {  
    setDateType(newValue)
    if (newValue) {  
      typeDate.current  = newValue; 
      fetchModuleSeries()  

      createEventLog(cookies.get('name')!, '/otomax/modul', 'number|tab-date-type', 'change', newValue)
    }
  };   
 
  // onload  
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
        fetchModuleBigNumber()
        fetchModuleSeries()
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, statusReload])
 
 
  const fetchAllData = () => {   
    fetchModuleBigNumber()  
    fetchModuleSeries()  
  };

  async function fetchModuleBigNumber() {
    setLoadingDataBigNumber(true)   
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
		await fetch('/api/otomax/module/big-number?start_date='+paramStartDate+'&end_date='+paramEndDate).then((response) => {
      if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){   
        setDataBigNumber(result['data'])
			} else { 
        toast.error(result["message"])
      }
      setLoadingDataBigNumber(false) 
		}).catch((error) => {  
      Sentry.captureException(error);
      setLoadingDataBigNumber(false) 
		});
  }
   

  async function fetchModuleSeries() {
    setLoadingDataSeries(true)   
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
		await fetch('/api/otomax/module/series?start_date='+paramStartDate+'&end_date='+paramEndDate+'&date_type='+typeDate.current).then((response) => {
      if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){   
        setDataSeries(result['data'])
        series[0]['data'] = []
        series[1]['data'] = []
        options.xaxis!.categories = []
        result['data'].forEach((element:SeriesDataModel )=> {
          options.xaxis?.categories.push(element.date)
          series[0]['data'].push(element.stok_sendiri)
          series[1]['data'].push(element.stok_luar)
        }); 
        setOptionData(options)
        setSeriesData(series)
			} else { 
        toast.error(result["message"])
      }
      setLoadingDataSeries(false) 
		}).catch((error) => {  
      Sentry.captureException(error);
      setLoadingDataSeries(false) 
		});
  }
   
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      
      {/* big number  */}
      <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Angka Modul
          </h3>  
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Angka modul aktif, stok dalam, stok luar
          </p>
        </div>   
      </div>
 
      <div className="grid grid-cols-12 gap-4 md:gap-4 mt-4"> 

        <div className="col-span-12 xl:col-span-3 space-y-3"> 
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-light-100 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Modul Aktif
              </span> 
            </div>  
            {
              loadingDataBigNumber || !dataBigNumber ?
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
                      <NumericFormat displayType="text" value={dataBigNumber?.modul_active} thousandSeparator="." decimalSeparator=","/>
                    </h4> 
                  </div> 
                  {
                    dataBigNumber?.modul_active_percent > 0 ? 
                    ( 
                      <div className="flex">
                        <Badge color="success"> 
                          <NumericFormat displayType="text" value={dataBigNumber?.modul_active_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                        </Badge> 
                        <div className="leading-none ml-2">
                          dari <br/>modul total
                        </div>
                      </div> 
                    ) : 
                    (
                      dataBigNumber?.modul_active_percent < 0 ? 
                      (
                        <div className="flex">
                          <Badge color="error"> 
                            <NumericFormat displayType="text" value={dataBigNumber?.modul_active_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge>  
                          <div className="leading-none ml-2">
                            dari <br/>modul total
                          </div>
                        </div> 
                      ) : 
                      ( 
                        <div className="flex">
                          <Badge color="light"> 
                            <NumericFormat displayType="text" value={dataBigNumber?.modul_active_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge> 
                          <div className="leading-none ml-2">
                            dari <br/>modul total
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

        <div className="col-span-12 xl:col-span-3 space-y-3"> 
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Modul Total
              </span> 
            </div>  
            {
              loadingDataBigNumber || !dataBigNumber ?
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
                      <NumericFormat displayType="text" value={dataBigNumber.modul_all} thousandSeparator="." decimalSeparator=","/>
                    </h4> 
                  </div>  
                </div> 
              )
            }
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3 space-y-3"> 
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-300 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Modul Aktif Stok Sendiri
              </span> 
            </div>  
            {
              loadingDataBigNumber || !dataBigNumber ?
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
                      <NumericFormat displayType="text" value={dataBigNumber?.modul_active_stok_sendiri} thousandSeparator="." decimalSeparator=","/>
                    </h4> 
                  </div> 
                  {
                    dataBigNumber?.modul_active_stok_sendiri_percent > 0 ? 
                    ( 
                      <div className="flex">
                        <Badge color="success"> 
                          <NumericFormat displayType="text" value={dataBigNumber?.modul_active_stok_sendiri_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                        </Badge> 
                        <div className="leading-none ml-2">
                          dari <br/>modul aktif
                        </div>
                      </div> 
                    ) : 
                    (
                      dataBigNumber?.modul_active_stok_sendiri_percent < 0 ? 
                      (
                        <div className="flex">
                          <Badge color="error"> 
                            <NumericFormat displayType="text" value={dataBigNumber?.modul_active_stok_sendiri_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge>
                          <div className="leading-none ml-2">
                            dari <br/>modul aktif
                          </div>
                        </div> 
                      ) : 
                      ( 
                        <div className="flex">
                          <Badge color="light"> 
                            <NumericFormat displayType="text" value={dataBigNumber?.modul_active_stok_sendiri_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge> 
                          <div className="leading-none ml-2">
                            dari <br/>modul aktif
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

        <div className="col-span-12 xl:col-span-3 space-y-3"> 
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Modul Aktif Stok Luar
              </span> 
            </div>   
            {
              loadingDataBigNumber || !dataBigNumber ?
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
                      <NumericFormat displayType="text" value={dataBigNumber?.modul_active_stok_luar} thousandSeparator="." decimalSeparator=","/>
                    </h4> 
                  </div> 
                  {
                    dataBigNumber?.modul_active_stok_luar_percent> 0 ? 
                    ( 
                      <div className="flex">
                        <Badge color="success"> 
                          <NumericFormat displayType="text" value={dataBigNumber?.modul_active_stok_luar_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                        </Badge>
                        <div className="leading-none ml-2">
                          dari <br/>modul aktif
                        </div>
                      </div> 
                    ) : 
                    (
                      dataBigNumber?.modul_active_stok_luar_percent < 0 ? 
                      (
                        <div className="flex">
                          <Badge color="error"> 
                            <NumericFormat displayType="text" value={dataBigNumber?.modul_active_stok_luar_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge> 
                          <div className="leading-none ml-2">
                            dari <br/>modul aktif
                          </div>
                        </div> 
                      ) : 
                      ( 
                        <div className="flex">
                          <Badge color="light"> 
                            <NumericFormat displayType="text" value={dataBigNumber?.modul_active_stok_luar_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge> 
                          <div className="leading-none ml-2">
                            dari <br/>modul aktif
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

      <div className="flex flex-col gap-5 mt-6 sm:flex-row sm:justify-between">
        <div className="w-full"> 
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            
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

      <div className="max-w-full mt-2">  
        {
          loadingDataSeries || !dataSeries ?
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