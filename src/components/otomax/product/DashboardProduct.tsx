"use client";
import { useEffect, useRef, useState } from "react";  
import Switch from "../../ui/switch/Switch"; 
import toast from "react-hot-toast";
import * as Sentry from "@sentry/browser";
import moment from "moment";
import 'moment/locale/id';
import { createEventLog } from "@/utils/log";
import { useCookies } from 'next-client-cookies';
import DateRangePickerComponent from '@wojtekmaj/react-daterange-picker';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css'; 
import { LineIconCalendar } from "@/icons/line-icon"; 
import ProductNumber from "./ProductNumber";
import ProductDetail from "./ProductDetail";

export default function DashboardProduct() { 

  const initializedOverview = useRef(false)
  const [statusReload, setStatusReload] = useState(true);
	const [lastUpdate, setLastUpdate] = useState<string>("");
      
  const now = new Date();
  const dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startDate = useRef(moment(dateStart).format('YYYY-MM-DD'))
  const endDate = useRef(moment(dateEnd).format('YYYY-MM-DD'))
  const [dateRange, setDateRange] = useState<[Date, Date]>([dateStart, dateEnd]);
   
  const cookies = useCookies();

  const changeStatusReload = () => {
      setStatusReload(!statusReload);
      
      createEventLog(cookies.get('name')!, '/otomax/product', 'metadata|status-reload', 'change', statusReload.toString())
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const changeDateRange = async (newValue) => { 
      setDateRange(newValue)
      if (newValue){
          startDate.current = moment(newValue[0]).format('YYYY-MM-DD')  
          endDate.current = moment(newValue[1]).format('YYYY-MM-DD')  
          createEventLog(cookies.get('name')!, '/otomax/product', 'metadata|datepicker', 'change', newValue)
      }
  }; 

  useEffect(() => { 
    if (!initializedOverview.current) {
        initializedOverview.current = true 
        fetchOverview()
    } 

    const interval = setInterval(() => { 
        if (statusReload) {
            fetchOverview()
        }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  })

	async function fetchOverview() {   
    await fetch('/api/otomax/overview').then((response) => {
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
 
      {/* big number */}
      <ProductNumber statusReload={statusReload} dateRange={dateRange}></ProductNumber>

      <ProductDetail statusReload={statusReload} dateRange={dateRange}></ProductDetail>


    </div>
  );

}

