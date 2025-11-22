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

export interface SeriesTransaksi{
  date: string,
  sukses: number,
  proses: number,
  gagal: number
}
 
export interface ParamProps {
  statusReload: boolean;
  dateRange: [Date, Date]; 
}
  
export default function OverviewJenisTransaksi({statusReload, dateRange}:ParamProps) {   

  // chart
  const options: ApexOptions = {
    colors: ["#12b76ace", "#0ba5ecce", "#f04438ce"],
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
          createEventLog(cookies.get('name')!, '/otomax/overview', 'jenis-transaksi|barchart', 'hover', JSON.stringify(value))
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
      name: 'Sukses',
      data: [] as number[]
    }, {
      name: 'Dalam Proses',
      data: [] as number[]
    }, {
      name: 'Gagal',
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
        fetchOverviewSeriesTransaksi() 
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, statusReload])

  const getAllData = () => {    
    fetchOverviewSeriesTransaksi() 
  } 
 
  const changeDateType = (newValue: string) => {  
    setDateType(newValue)
    if (newValue) {  
      typeDate.current  = newValue;
      fetchOverviewSeriesTransaksi()  

      createEventLog(cookies.get('name')!, '/otomax/overview', 'jenis-transaksi|tab-date-type', 'change', newValue)
    }
  };

  async function fetchOverviewSeriesTransaksi() {
    setLoadingData(true)   
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
		await fetch('/api/otomax/overview/series-transaksi?start_date='+paramStartDate+'&end_date='+paramEndDate+'&date_type='+typeDate.current).then((response) => {
      if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){   
        series[0]['data'] = []
        series[1]['data'] = []
        series[2]['data'] = []
        options.xaxis!.categories = []
        result['data'].forEach((element: SeriesTransaksi)=> { 
          options.xaxis?.categories.push(element['date'])
          series[0]['data'].push(element['sukses'])
          series[1]['data'].push(element['proses'])
          series[2]['data'].push(element['gagal'])
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
            Perbandingan Jenis Transaksi
          </h3>  
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Angka jumlah transaksi, per waktu
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
