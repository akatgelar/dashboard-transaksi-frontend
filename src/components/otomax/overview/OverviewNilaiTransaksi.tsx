"use client";
import React, { useEffect, useRef, useState } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";     
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css'
import moment from "moment";
import toast from "react-hot-toast";
import * as Sentry from "@sentry/browser"; 
import { createEventLog } from "@/utils/log";
import { useCookies } from 'next-client-cookies';

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
}); 

export interface SeriesModel { 
  name: string,
  data: number[], 
};
 
export interface SeriesOmsetMargin{
  date: string,
  omset: number,
  margin: number, 
}
 
export interface ParamProps {
  statusReload: boolean;
  dateRange: [Date, Date]; 
}
  
export default function OverviewNilaiTransaksi({statusReload, dateRange}:ParamProps) {   

  // chart
  const options: ApexOptions = {
    colors: ["#328E6E", "#1B56FD"],
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
      type: "bar",
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
          createEventLog(cookies.get('name')!, '/otomax/overview', 'nilai-transaksi|barchart', 'hover', JSON.stringify(value))
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
      enabled: false, // Disable data labels
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
      type: "category",  
      categories: [],
      axisBorder: {
        show: false,  
      },
      axisTicks: {
        show: false, 
      },
      tooltip: {
        enabled: false,  
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
          style: {
            fontSize: "12px", // Adjust font size for y-axis labels
            colors: ["#6B7280"], // Color of the labels
          }, 
          formatter: function(value) {
            return 'Rp. ' + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
          }
        },
        title: {
          text: "", // Remove y-axis title
          style: {
            fontSize: "0px",
          },
        },
      },
      {
        labels: {
          style: {
            fontSize: "12px", // Adjust font size for y-axis labels
            colors: ["#6B7280"], // Color of the labels
          }, 
          formatter: function(value) {
            return 'Rp. ' + value.toLocaleString().replace(/,/g, '.'); // This will add thousand separators
          }
        },
        opposite: true,
        title: {
          text: "", // Remove y-axis title
          style: {
            fontSize: "0px",
          },
        },
      },
    ],
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: "right",
      fontFamily: "Outfit",
    }, 
  };

  const series = [
    {
      name: "Omset",
      data: [] as number[]
    }, 
    {
      name: "Margin",
      data: [] as number[]
    },  
  ]; 

  // tab 
  const getButtonClass = (option: "MONTH"|"WEEK"|"DAY") =>
    dateType === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";
 
  const typeDate = useRef('DAY')
  const [dateType, setDateType] = useState<string>("DAY");
   
  const [loadingData, setLoadingData] = useState(true);
  const [seriesData, setSeriesData] = useState<SeriesModel[]>(series)
  const [optionData, setOptionData] = useState<ApexOptions>(options)
 
  const cookies = useCookies();

  // onload  
  useEffect(() => {  
    getAllData()
   
    const interval = setInterval(() => {  
      typeDate.current  = dateType;
      if (statusReload) {
        fetchOverviewSeriesOmsetMargin() 
      }
    }, 5 * 60 * 1000) 
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, statusReload])
 
  const getAllData = () => {    
    fetchOverviewSeriesOmsetMargin() 
  };
 
  const changeDateType = (newValue: string) => {  
    setDateType(newValue)
    if (newValue) {  
      typeDate.current  = newValue;
      fetchOverviewSeriesOmsetMargin()  

      createEventLog(cookies.get('name')!, '/otomax/overview', 'nilai-transaksi|tab-date-type', 'change', newValue)
    }
  };

  async function fetchOverviewSeriesOmsetMargin() {
    setLoadingData(true)   
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
		await fetch('/api/otomax/overview/series-omset-margin?start_date='+paramStartDate+'&end_date='+paramEndDate+'&date_type='+typeDate.current).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){   
        series[0]['data'] = []
        series[1]['data'] = []
        options.xaxis!.categories = []
        result['data'].forEach((element: SeriesOmsetMargin)=> {
          options.xaxis?.categories.push(element.date)
          series[0]['data'].push(element.omset)
          series[1]['data'].push(element.margin)
        }); 
        setOptionData(options) 
        setSeriesData(series)
			} else { 
        toast.error(result["message"])
      }
      setLoadingData(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingData(false) 
		});
  }
        
   
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Statistik Nilai Transaksi
          </h3>  
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Nilai transaksi dalam rupiah, per waktu
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

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          {
            loadingData ?
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
              <ReactApexChart
                options={optionData}
                series={seriesData}
                type="bar"
                height={300}
              />
            )
          }
        </div>
      </div>
    </div>
  );
}
