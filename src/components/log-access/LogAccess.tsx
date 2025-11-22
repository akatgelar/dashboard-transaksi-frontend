'use client'

import { useEffect, useRef, useState } from "react";
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css'; 
import Switch from "../ui/switch/Switch";  
import toast from "react-hot-toast";
import moment from "moment";
import 'moment/locale/id';
import * as Sentry from "@sentry/browser"; 
import { createEventLog } from "@/utils/log";
import { useCookies } from 'next-client-cookies'; 
import dynamic from "next/dynamic";
import DateRangePickerComponent from '@wojtekmaj/react-daterange-picker';
import { LineIconCalendar, LineIconCheckCircle } from "@/icons/line-icon"; 
import { ApexOptions } from "apexcharts";    
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css'  
import { AllCommunityModule, ModuleRegistry, TextFilterModule } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; 
import * as XLSX from "xlsx";

ModuleRegistry.registerModules([AllCommunityModule, TextFilterModule]);

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
}); 


export interface LogNumber { 
  category: string,
  count: number
};

export interface LogSeries { 
  date: string,
  count: number
};

export interface LogTable { 
  date: string,
  user: string,
  category: string,
  path: string,
  component: string,
  data: string,
};
 
export interface SeriesModel { 
  name: string,
  data: number[], 
};

export default function LogAccess() { 

  const initializedOverview = useRef(false)
  const [statusReload, setStatusReload] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // tab 
  const getButtonClassDate = (option: "MONTH"|"WEEK"|"DAY") =>
    dateType === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";
   
  // variable for api
  const now = new Date();
  const dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startDate = useRef(moment(dateStart).format('YYYY-MM-DD'))
  const endDate = useRef(moment(dateEnd).format('YYYY-MM-DD'))
  const [dateRange, setDateRange] = useState<[Date, Date]>([dateStart, dateEnd]); 
  
  const typeDate = useRef('DAY') 
  const [dateType, setDateType] = useState<string>("DAY"); 
  
  const cookies = useCookies();

  // top login
  const optionsTopLogin: ApexOptions = { 
    colors: ["#27548A"],
    chart: { 
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      }, 
      zoom: {
        enabled: false,
        allowMouseWheelZoom: false,
      },
      events: {
        dataPointMouseEnter: function (event, chartContext, opts) { 
          const value = {
            'xaxis': opts['w']['config']['xaxis']['categories'][opts.dataPointIndex],
            'yaxis': opts['w']['config']['series'][opts.seriesIndex]['data'][opts.dataPointIndex],
            'zaxis': opts['w']['config']['series'][opts.seriesIndex]['name']
          }
          createEventLog(cookies.get('name')!, '/log-access', 'top-login|barchart', 'hover', JSON.stringify(value))
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: true
      }
    },
    dataLabels: {
      style: {
        colors: ['#FFFFFF']
      },
      enabled: true,
      dropShadow: {
        enabled: false,
      },
    },
    labels: [],
    xaxis: {
      categories: []
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
      itemMargin: {
          horizontal: 5,
          vertical: 0
      }, 
    },
  };
  let seriesTopLogin: SeriesModel[] = []; 
  const [loadingTopLogin, setLoadingTopLogin] = useState(true);
  const [seriesDataTopLogin, setSeriesDataTopLogin] = useState<SeriesModel[]>(seriesTopLogin)
  const [optionDataTopLogin, setOptionDataTopLogin] = useState<ApexOptions>(optionsTopLogin)

  // top device
  const optionsTopDevice: ApexOptions = { 
    colors: ["#BBD8A3", "#DDDDDD", "#FF9B45", "#A1E3F9", "#3D90D7"],
    chart: { 
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      }, 
      zoom: {
        enabled: false,
        allowMouseWheelZoom: false,
      },
      foreColor: "#FFFFFF",
      events: {
        dataPointMouseEnter: function (event, chartContext, opts) {  
          const value = {
            'xaxis': opts['w']['config']['labels'][opts.dataPointIndex],
            'yaxis': opts['w']['config']['series'][opts.dataPointIndex], 
          }
          createEventLog(cookies.get('name')!, '/log-access', 'top-device|piechart', 'hover', JSON.stringify(value))
        }
      }
    },
    dataLabels: {
      style: {
        colors: ['#FFFFFF','#FFFFFF','#FFFFFF']
      },
      enabled: true,
      dropShadow: {
        enabled: false,
      },
    },
    labels: [],
    xaxis: {
      categories: []
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
      itemMargin: {
          horizontal: 5,
          vertical: 0
      }, 
    },
  };
  let seriesTopDevice: number[] = []; 
  const [loadingTopDevice, setLoadingTopDevice] = useState(true);
  const [seriesDataTopDevice, setSeriesDataTopDevice] = useState<number[]>(seriesTopDevice)
  const [optionDataTopDevice, setOptionDataTopDevice] = useState<ApexOptions>(optionsTopDevice)

  // top user
  const optionsTopUser: ApexOptions = { 
    colors: ["#27548A"],
    chart: { 
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      }, 
      zoom: {
        enabled: false,
        allowMouseWheelZoom: false,
      },
      events: {
        dataPointMouseEnter: function (event, chartContext, opts) { 
          const value = {
            'xaxis': opts['w']['config']['xaxis']['categories'][opts.dataPointIndex],
            'yaxis': opts['w']['config']['series'][opts.seriesIndex]['data'][opts.dataPointIndex],
            'zaxis': opts['w']['config']['series'][opts.seriesIndex]['name']
          }
          createEventLog(cookies.get('name')!, '/log-access', 'top-user|barchart', 'hover', JSON.stringify(value))
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: true
      }
    },
    dataLabels: {
      style: {
        colors: ['#FFFFFF']
      },
      enabled: true,
      dropShadow: {
        enabled: false,
      },
    },
    labels: [],
    xaxis: {
      categories: []
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
      itemMargin: {
          horizontal: 5,
          vertical: 0
      }, 
    },
  };
  let seriesTopUser: SeriesModel[] = []; 
  const [loadingTopUser, setLoadingTopUser] = useState(true);
  const [seriesDataTopUser, setSeriesDataTopUser] = useState<SeriesModel[]>(seriesTopUser)
  const [optionDataTopUser, setOptionDataTopUser] = useState<ApexOptions>(optionsTopUser)

  // top page
  const optionsTopPage: ApexOptions = { 
    colors: ["#FFC145"],
    chart: { 
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      }, 
      zoom: {
        enabled: false,
        allowMouseWheelZoom: false,
      },
      events: {
        dataPointMouseEnter: function (event, chartContext, opts) { 
          const value = {
            'xaxis': opts['w']['config']['xaxis']['categories'][opts.dataPointIndex],
            'yaxis': opts['w']['config']['series'][opts.seriesIndex]['data'][opts.dataPointIndex],
            'zaxis': opts['w']['config']['series'][opts.seriesIndex]['name']
          }
          createEventLog(cookies.get('name')!, '/log-access', 'top-page|barchart', 'hover', JSON.stringify(value))
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: true
      }
    },
    dataLabels: {
      style: {
        colors: ['#FFFFFF']
      },
      enabled: true,
      dropShadow: {
        enabled: false,
      },
    },
    labels: [],
    xaxis: {
      categories: []
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
      itemMargin: {
          horizontal: 5,
          vertical: 0
      }, 
    },
  };
  let seriesTopPage: SeriesModel[] = []; 
  const [loadingTopPage, setLoadingTopPage] = useState(true);
  const [seriesDataTopPage, setSeriesDataTopPage] = useState<SeriesModel[]>(seriesTopPage)
  const [optionDataTopPage, setOptionDataTopPage] = useState<ApexOptions>(optionsTopPage)

  // top component
  const optionsTopComponent: ApexOptions = { 
    colors: ["#FB4141"],
    chart: { 
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      }, 
      zoom: {
        enabled: false,
        allowMouseWheelZoom: false,
      },
      events: {
        dataPointMouseEnter: function (event, chartContext, opts) { 
          const value = {
            'xaxis': opts['w']['config']['xaxis']['categories'][opts.dataPointIndex],
            'yaxis': opts['w']['config']['series'][opts.seriesIndex]['data'][opts.dataPointIndex],
            'zaxis': opts['w']['config']['series'][opts.seriesIndex]['name']
          }
          createEventLog(cookies.get('name')!, '/log-access', 'top-component|barchart', 'hover', JSON.stringify(value))
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: true
      }
    },
    dataLabels: {
      style: {
        colors: ['#FFFFFF']
      },
      enabled: true,
      dropShadow: {
        enabled: false,
      },
    },
    labels: [],
    xaxis: {
      categories: []
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
      itemMargin: {
          horizontal: 5,
          vertical: 0
      }, 
    },
  };
  let seriesTopComponent: SeriesModel[] = []; 
  const [loadingTopComponent, setLoadingTopComponent] = useState(true);
  const [seriesDataTopComponent, setSeriesDataTopComponent] = useState<SeriesModel[]>(seriesTopComponent)
  const [optionDataTopComponent, setOptionDataTopComponent] = useState<ApexOptions>(optionsTopComponent)

  // series page
  const optionsSeriesPage: ApexOptions = { 
    colors: ["#1B56FD", "#60B5FF"],
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
      zoom: {
        enabled: false
      },
      stacked: true,
      events: {
        dataPointMouseEnter: function (event, chartContext, opts) { 
          const value = {
            'xaxis': opts['w']['config']['xaxis']['categories'][opts.dataPointIndex],
            'yaxis': opts['w']['config']['series'][opts.seriesIndex]['data'][opts.dataPointIndex],
            'zaxis': opts['w']['config']['series'][opts.seriesIndex]['name']
          }
          createEventLog(cookies.get('name')!, '/log-access', 'series-page|linechart', 'hover', JSON.stringify(value))
        }
      }
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'straight'
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
      categories: ['2025-01-01', '2025-02-01', '2025-03-01'],
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
  let seriesSeriesPage : SeriesModel[] = [
    { 
      'name': 'Banyak akses',
      'data': [345, 252, 110]
    }
  ];
  const [loadingSeriesPage, setLoadingSeriesPage] = useState(true);
  const [seriesDataSeriesPage, setSeriesDataSeriesPage] = useState<SeriesModel[]>(seriesSeriesPage)
  const [optionDataSeriesPage, setOptionDataSeriesPage] = useState<ApexOptions>(optionsSeriesPage)

  // table
  const [loadingLogTable, setLoadingLogTable] = useState(true);
  const [logTableData, setLogTableData] = useState<LogTable[]>() 
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const column: any = [];
  const [rowData, setRowData] = useState(); 
  const [colDefs, setColDefs] = useState<any[]>(column);

  useEffect(() => { 
    if (!initializedOverview.current) {
      initializedOverview.current = true 
      fetchOverview()
      fetchTopLogin()
      fetchTopUser()
      fetchTopDevice()
      fetchTopPage()
      fetchTopComponent()
      fetchSeriesPage()
      fetchLogTable()
    } 

    const interval = setInterval(() => { 
      if (statusReload) {
          fetchOverview()
          fetchTopLogin()
          fetchTopUser()
          fetchTopDevice()
          fetchTopPage()
          fetchTopComponent()
          fetchSeriesPage()
          fetchLogTable()
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  })

  const changeStatusReload = () => {
      setStatusReload(!statusReload);

      createEventLog(cookies.get('name')!, '/log-access', 'metadata|status-reload', 'change', statusReload.toString())
  };
  
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const changeDateRange = (newValue) => { 
    setDateRange(newValue)
    if (newValue){  
      startDate.current  = moment(newValue[0]).format('YYYY-MM-DD')
      endDate.current  = moment(newValue[1]).format('YYYY-MM-DD')  

      fetchOverview()
      fetchTopLogin()
      fetchTopUser()
      fetchTopDevice()
      fetchTopPage()
      fetchTopComponent()
      fetchSeriesPage()
      fetchLogTable()
      
      createEventLog(cookies.get('name')!, '/log-access', 'metadata|datepicker', 'change', newValue)
    }
  };
  
  const changeDateType = (newValue: string) => {  
    setDateType(newValue)
    if (newValue) {  
      typeDate.current  = newValue; 
       
      fetchSeriesPage()

      createEventLog(cookies.get('name')!, '/log-access', 'series-page|tab-date-type', 'change', newValue)
    }
  };

  async function fetchOverview() {   
    await fetch('/api/log').then((response) => {
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

  async function fetchTopLogin() {
    setLoadingTopLogin(true)   
		await fetch('/api/log/top-login?start_date='+startDate.current+'&end_date='+endDate.current).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){     
        // clear data 
        seriesTopLogin = [];
        seriesTopLogin.push({name: '', data: []});

        result['data'].forEach((element: LogNumber)=> { 
          // xaxis
          optionsTopLogin.xaxis?.categories.push(element.category)
          // yaxis 
          seriesTopLogin[0]['name'] = "Jumlah Login"
          seriesTopLogin[0]['data'].push(element.count)
        }); 
        setOptionDataTopLogin(optionsTopLogin) 
        
        setSeriesDataTopLogin(seriesTopLogin) 
			} else { 
        toast.error(result["message"])
      }
      setLoadingTopLogin(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingTopLogin(false) 
		});
  }

  async function fetchTopUser() {
    setLoadingTopUser(true)   
		await fetch('/api/log/top-user?start_date='+startDate.current+'&end_date='+endDate.current).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){     
        // clear data 
        seriesTopUser = [];
        seriesTopUser.push({name: '', data: []});

        result['data'].forEach((element: LogNumber)=> { 
          // xaxis
          optionsTopUser.xaxis?.categories.push(element.category)
          // yaxis 
          seriesTopUser[0]['name'] = "Jumlah Akses User"
          seriesTopUser[0]['data'].push(element.count)
        }); 
        setOptionDataTopUser(optionsTopUser) 
        
        setSeriesDataTopUser(seriesTopUser) 
			} else { 
        toast.error(result["message"])
      }
      setLoadingTopUser(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingTopUser(false) 
		});
  }

  async function fetchTopDevice() {
    setLoadingTopDevice(true)   
		await fetch('/api/log/top-device?start_date='+startDate.current+'&end_date='+endDate.current).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){     
        // clear data 
        seriesTopDevice = []; 

        result['data'].forEach((element: LogNumber)=> { 
          // xaxis
          optionsTopDevice.labels?.push(element.category)
          // yaxis  
          seriesTopDevice.push(element.count)
        }); 
        setOptionDataTopDevice(optionsTopDevice) 
        
        setSeriesDataTopDevice(seriesTopDevice) 
			} else { 
        toast.error(result["message"])
      }
      setLoadingTopDevice(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingTopDevice(false) 
		});
  }

  async function fetchTopPage() {
    setLoadingTopPage(true)   
		await fetch('/api/log/top-page?start_date='+startDate.current+'&end_date='+endDate.current).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){     
        // clear data 
        seriesTopPage = [];
        seriesTopPage.push({name: '', data: []});

        result['data'].forEach((element: LogNumber)=> { 
          // xaxis
          optionsTopPage.xaxis?.categories.push(element.category)
          // yaxis 
          seriesTopPage[0]['name'] = "Jumlah Akses Page"
          seriesTopPage[0]['data'].push(element.count)
        }); 
        setOptionDataTopPage(optionsTopPage) 
        
        setSeriesDataTopPage(seriesTopPage) 
			} else { 
        toast.error(result["message"])
      }
      setLoadingTopPage(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingTopPage(false) 
		});
  }

  async function fetchTopComponent() {
    setLoadingTopComponent(true)   
		await fetch('/api/log/top-component?start_date='+startDate.current+'&end_date='+endDate.current).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){     
        // clear data 
        seriesTopComponent = [];
        seriesTopComponent.push({name: '', data: []});

        result['data'].forEach((element: LogNumber)=> { 
          // xaxis
          optionsTopComponent.xaxis?.categories.push(element.category)
          // yaxis 
          seriesTopComponent[0]['name'] = "Jumlah Akses Component"
          seriesTopComponent[0]['data'].push(element.count)
        }); 
        setOptionDataTopComponent(optionsTopComponent) 
        
        setSeriesDataTopComponent(seriesTopComponent) 
			} else { 
        toast.error(result["message"])
      }
      setLoadingTopComponent(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingTopComponent(false) 
		});
  }

  async function fetchSeriesPage() {
    setLoadingSeriesPage(true)   
		await fetch('/api/log/series-page?start_date='+startDate.current+'&end_date='+endDate.current+'&date_type='+typeDate.current).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){     
        // clear data 
        seriesSeriesPage = [];
        seriesSeriesPage.push({name: '', data: []});

        result['data'].forEach((element: LogSeries)=> { 
          // xaxis
          optionsSeriesPage.xaxis?.categories.push(element.date)
          // yaxis 
          seriesSeriesPage[0]['name'] = "Jumlah akses per waktu"
          seriesSeriesPage[0]['data'].push(element.count)
        }); 
        setOptionDataSeriesPage(optionsSeriesPage) 
        
        setSeriesDataSeriesPage(seriesSeriesPage) 
			} else { 
        toast.error(result["message"])
      }
      setLoadingSeriesPage(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingSeriesPage(false) 
		});
  }

  async function fetchLogTable() {
    setLoadingLogTable(true)   
		await fetch('/api/log/table?start_date='+startDate.current+'&end_date='+endDate.current).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){     

        setLogTableData(result['data']) 
        setRowData(result['data'])  
        setColDefs([
          { field: "date", filter: true, minWidth: 100},
          { field: "user", headerName: "User", filter: true, minWidth: 100},
          { field: "category", headerName: "Kategori", filter: true, minWidth: 50}, 
          { field: "path", headerName: "Menu" , minWidth: 200},
          { field: "component", headerName: "Komponen" , minWidth: 300},
          { field: "data", headerName: "Data" , minWidth: 300}
        ]);  
			} else { 
        toast.error(result["message"])
      }
      setLoadingLogTable(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingLogTable(false) 
		});
  }

  const [loadingDownload, setLoadingDownload] = useState(false);
  async function actionDownload() {
    try {
      setLoadingDownload(true);  

      const title = 'Log Action';
      const now = new Date(); 
      const dateString = moment(now).format('YYYY.MM.DD HH.mm.ss'); 
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils?.json_to_sheet(rowData!);
      XLSX.utils.book_append_sheet(workbook, worksheet, title); 
      XLSX.writeFile(workbook, `${title} - ${dateString}.xlsx`); 
      setLoadingDownload(false); 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      setLoadingDownload(false); 
    }
  };

  return (
    <div className="space-y-3"> 

      {/* auto refresh */}
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
                  defaultChecked={statusReload}
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

      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        
        {/* chart  */}
        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Log Akses
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Jumlah login, akses page, action event pada dashboard
            </p>
          </div>  
          <div className="block xl:flex justify-between mb-2 ">  
            <div className="relative mr-2">   
            </div>  
            <div className="relative">   
            </div>
          </div>  
        </div>
 
        <div className="grid grid-cols-12 gap-4 md:gap-4 mt-4"> 

          <div className="col-span-12 xl:col-span-4 space-y-3"> 
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Top Login
              </span> 
            </div> 
            <div className="-ml-5 xl:min-w-full pl-2">
              {
                loadingTopLogin || !seriesDataTopLogin ?
                (
                  <Skeleton height={200}   className=""/>  
                ) : 
                (
                  <ReactApexChart
                    options={optionDataTopLogin}
                    series={seriesDataTopLogin}
                    type="bar"
                    height={300}
                  />  
                )
              }
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 space-y-3"> 
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Top Device
              </span> 
            </div> 
            <div className="-ml-5 xl:min-w-full pl-2">
              {
                loadingTopDevice || !seriesDataTopDevice ?
                (
                  <Skeleton height={200}   className=""/>  
                ) : 
                (
                  <ReactApexChart
                    options={optionDataTopDevice}
                    series={seriesDataTopDevice}
                    type="pie"
                    height={250}
                  />  
                )
              }
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 space-y-3"> 
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Top User Access
              </span> 
            </div> 
            <div className="-ml-5 xl:min-w-full pl-2">
              {
                loadingTopUser || !seriesDataTopUser ?
                (
                  <Skeleton height={200}   className=""/>  
                ) : 
                (
                  <ReactApexChart
                    options={optionDataTopUser}
                    series={seriesDataTopUser}
                    type="bar"
                    height={300}
                  />  
                )
              }
            </div>
          </div>
 
          <div className="col-span-12 xl:col-span-6 space-y-3"> 
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Top Page
              </span> 
            </div> 
            <div className="-ml-5 xl:min-w-full pl-2">
              {
                loadingTopPage || !seriesDataTopPage ?
                (
                  <Skeleton height={200}   className=""/>  
                ) : 
                (
                  <ReactApexChart
                    options={optionDataTopPage}
                    series={seriesDataTopPage}
                    type="bar"
                    height={500}
                  />  
                )
              }
            </div>
          </div>
 
          <div className="col-span-12 xl:col-span-6 space-y-3"> 
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                <LineIconCheckCircle /> 
              </div> 
              <span className="text-md text-gray-500 dark:text-gray-400">
                Top Component
              </span> 
            </div> 
            <div className="-ml-5 xl:min-w-full pl-2">
              {
                loadingTopComponent || !seriesDataTopComponent ?
                (
                  <Skeleton height={200}   className=""/>  
                ) : 
                (
                  <ReactApexChart
                    options={optionDataTopComponent}
                    series={seriesDataTopComponent}
                    type="bar"
                    height={500}
                  />  
                )
              }
            </div>
          </div>
 
          <div className="col-span-12 xl:col-span-12 space-y-3"> 
            <div className="flex items-center space-x-3"> 
              <div className="flex items-center space-x-3 w-full">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Series Akses
                </span>   
              </div>
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
            <div className="-ml-5 xl:min-w-full pl-2">
              {
                loadingSeriesPage || !seriesDataSeriesPage ?
                (
                  <Skeleton height={200}   className=""/>  
                ) : 
                (
                  <ReactApexChart
                    options={optionDataSeriesPage}
                    series={seriesDataSeriesPage}
                    type="line"
                    height={300}
                  />  
                )
              }
            </div>
          </div>


          <div className="col-span-12 xl:col-span-12 space-y-3"> 
            <div className="flex items-center space-x-3"> 
              <div className="flex items-center space-x-3 w-full">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Tabel Data
                </span>   
              </div>
               
            </div> 
            <div >
              {
                loadingLogTable || !logTableData ?
                (
                  <div>
                    <Skeleton height={200}   className=""/>  
                    <br/>
                  </div>
                ) :
                (
                  <div style={{ width: "100%", height: "500px" }}>
                    <button onClick={() => actionDownload()} className="mb-2 inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-green-500 shadow-theme-xs hover:bg-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0 0 26 26" fill="#FFF">
                        <path d="M 15 0 L 0 2.875 L 0 23.125 L 15 26 Z M 16 3 L 16 5.96875 L 19.03125 5.96875 L 19.03125 8 L 16 8 L 16 10 L 19 10 L 19 12 L 16 12 L 16 14 L 19 14 L 19 16 L 16 16 L 16 18 L 19 18 L 19 20 L 16 20 L 16 23 L 25.15625 23 C 25.617188 23 26 22.605469 26 22.125 L 26 3.875 C 26 3.394531 25.617188 3 25.15625 3 Z M 20 6 L 24 6 L 24 8 L 20 8 Z M 3.09375 7.9375 L 5.84375 7.9375 L 7.3125 11 C 7.425781 11.238281 7.535156 11.515625 7.625 11.84375 C 7.683594 11.644531 7.8125 11.359375 7.96875 10.96875 L 9.5625 7.9375 L 12.09375 7.9375 L 9.0625 12.96875 L 12.1875 18.09375 L 9.5 18.09375 L 7.75 14.78125 C 7.683594 14.660156 7.601563 14.421875 7.53125 14.09375 L 7.5 14.09375 C 7.46875 14.25 7.402344 14.496094 7.28125 14.8125 L 5.53125 18.09375 L 2.8125 18.09375 L 6.03125 13.03125 Z M 20 10 L 24 10 L 24 12 L 20 12 Z M 20 14 L 24 14 L 24 16 L 20 16 Z M 20 18 L 24 18 L 24 20 L 20 20 Z"></path>
                      </svg>
                      {loadingDownload ? "Loading..." : "Export Excel"}
                    </button>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={colDefs} 
                    /> 
                  </div>
                )
              }
            </div>  
          </div>

        </div> 

      </div>

  </div>
  );

}

