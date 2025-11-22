"use client";
import { useEffect, useRef, useState } from "react";   
import moment from "moment";
import 'moment/locale/id';
import { useCookies } from 'next-client-cookies';
import toast from "react-hot-toast";
import * as Sentry from "@sentry/browser"; 

export interface PageModel { 
  category: string,
  count: number,  
};

export interface ActionModel { 
  path: string,
  action: string,
  action_component: string,
  count: number,  
};

export default function Home() {   
   
    const initializedOverview = useRef(false)
    const cookies = useCookies(); 
     
    const lastLogin = useRef(new Date());
    const lastLoginStr = useRef(moment(lastLogin.current).format('LLLL'));
    const countPage = useRef(0);
 
   const [topPageData, setTopPageData] = useState<PageModel[]>()
   const [topActionData, setTopActionData] = useState<ActionModel[]>()

    useEffect(() => { 
        if (!initializedOverview.current) {
            initializedOverview.current = true 
            fetchLastLogin()
            fetchCountPage()
            fetchTopPage()
            fetchTopAction() 
        } 

        const interval = setInterval(() => {  
            fetchLastLogin()
            fetchCountPage()
            fetchTopPage()
            fetchTopAction()  
        }, 5 * 60 * 1000)
        return () => clearInterval(interval)
    })

    async function fetchLastLogin() {   
        await fetch('/api/log/user_last_login?email='+cookies.get('email')).then((response) => {
            if (response.status >= 500 && response.status < 600) {
                toast.error(response.statusText)
            }  
            return response;
        }).then(async (response) => {
            const result = await response.json()  
            if (result["status"] == true){  
                lastLogin.current = result["data"]
                lastLoginStr.current = moment(lastLogin.current).format('LLLL')  
            } else { 
                toast.error(result['message'])
            } 
        }).catch((error) => { 
            Sentry.captureException(error); 
        });
    }

    async function fetchCountPage() {   
        await fetch('/api/log/user_count_page_access?name='+cookies.get('name')).then((response) => {
            if (response.status >= 500 && response.status < 600) {
                toast.error(response.statusText)
            }  
            return response;
        }).then(async (response) => {
            const result = await response.json()  
            if (result["status"] == true){  
                countPage.current = result["data"] 
            } else { 
                toast.error(result['message'])
            } 
        }).catch((error) => { 
            Sentry.captureException(error); 
        });
    }

    async function fetchTopPage() {   
        await fetch('/api/log/user_top_page_access?name='+cookies.get('name')).then((response) => {
            if (response.status >= 500 && response.status < 600) {
                toast.error(response.statusText)
            }  
            return response;
        }).then(async (response) => {
            const result = await response.json()  
            if (result["status"] == true){  
                setTopPageData(result['data'])
            } else { 
                toast.error(result['message'])
            } 
        }).catch((error) => { 
            Sentry.captureException(error); 
        });
    }

    async function fetchTopAction() {   
        await fetch('/api/log/user_top_action_access?name='+cookies.get('name')).then((response) => {
            if (response.status >= 500 && response.status < 600) {
                toast.error(response.statusText)
            }  
            return response;
        }).then(async (response) => {
            const result = await response.json()  
            if (result["status"] == true){  
                setTopActionData(result['data'])
            } else { 
                toast.error(result['message'])
            } 
        }).catch((error) => { 
            Sentry.captureException(error); 
        });
    }

    return(
        <div className="space-y-3"> 
          
            <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pt-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      
                {/* big number  */}
                <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
                    <div className="w-full">
                        <h3 className="text-lg text-gray-800 dark:text-white/90">
                        Selamat datang, <b>{cookies.get('name')}</b><br/>
                        Role Anda : <b>{cookies.get('role')}</b><br/>
                        </h3>   
                    </div>   
                </div>
 
                <div className="grid grid-cols-12 gap-4 md:gap-4 mt-12 mb-6">  
                    <div className="col-span-12 xl:col-span-12 space-y-3">  
                        <p>Terakhir Anda login : <b>{lastLoginStr.current}</b></p> 
                        <p>Anda sudah membuka page dashboard sebanyak : <b>{countPage.current} kali</b></p> 
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-12 gap-4 md:gap-4 mt-6 mb-6 "> 
                <div className="col-span-12 xl:col-span-4 space-y-3">   
                    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pt-6 pb-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                        <p>Page yang sering Anda buka : </p>
                        <ul className="mt-4">
                            <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                                <div className="flex items-center w-3/5 gap-3">
                                    <p className="text-sm text-gray-500 truncate"><b>Page</b></p>
                                </div>
                                <div className="w-1/5 text-right">
                                    <p className="text-sm text-gray-500 truncate"><b>Jumlah</b></p>
                                </div>
                            </div>
                            {topPageData?.map((item, index) => ( 
                                <div key={index} className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                                    <div className="flex items-center w-3/5 gap-3">
                                        <p className="text-sm text-gray-500 truncate">{item.category}</p>
                                    </div>
                                    <div className="w-1/5 text-right">
                                        <span className="block text-xs text-gray-400">{item.count} kali</span>
                                    </div>
                                </div>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="col-span-12 xl:col-span-8 space-y-3">   
                    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pt-6 pb-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                        <p>Action yang sering Anda lakukan : </p>
                        <ul className="mt-4">
                            <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                                <div className="flex items-center w-3/5 gap-3">
                                    <p className="text-sm text-gray-500 truncate"><b>Path</b></p>
                                </div>
                                <div className="flex items-center w-3/5 gap-3">
                                    <p className="text-sm text-gray-500 truncate"><b>Action</b></p>
                                </div>
                                <div className="flex items-center w-3/5 gap-3">
                                    <p className="text-sm text-gray-500 truncate"><b>Component</b></p>
                                </div>
                                <div className="w-1/5 text-right">
                                    <p className="text-sm text-gray-500 truncate"><b>Jumlah</b></p>
                                </div>
                            </div>
                            {topActionData?.map((item, index) => ( 
                                <div key={index} className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                                    <div className="flex items-center w-3/5 gap-3">
                                        <p className="text-sm text-gray-500 truncate">{item.path}</p>
                                    </div>
                                    <div className="flex items-center w-3/5 gap-3">
                                        <p className="text-sm text-gray-500 truncate">{item.action}</p>
                                    </div>
                                    <div className="flex items-center w-3/5 gap-3">
                                        <p className="text-sm text-gray-500 truncate">{item.action_component}</p>
                                    </div>
                                    <div className="w-1/5 text-right">
                                        <span className="block text-xs text-gray-400">{item.count} kali</span>
                                    </div>
                                </div>
                            ))}
                        </ul>
                    </div>
                </div> 
            </div>

        </div>
    );
}