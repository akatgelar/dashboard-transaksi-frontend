"use client";   
import { useEffect, useRef, useState } from "react"; 
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css'  
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css'; 
import moment from "moment";
import 'moment/locale/id';
import toast from "react-hot-toast";
import * as Sentry from "@sentry/browser";   
import { createEventLog } from "@/utils/log"; 
import { useCookies } from "next-client-cookies";
   
export interface AccountModel { 
  id: number,
  category: string, 
  number: string, 
  name: string, 
  indent: number, 
  balance_amount: number,  
};

export default function JurnalAccount() { 
 
  const cookies = useCookies();

  // metadata
  const initializedMetadata = useRef(false)
  const [lastUpdate, setLastUpdate] = useState<string>("");
   
  // account
  const [loadingData, setloadingData] = useState(true); 
  const [allData, setAllData] = useState<AccountModel[]>()
  const [filteredData, setFilteredData] = useState<AccountModel[]>()
  const [totalAmount, setTotalAmount] = useState<number>()

  // tab 
  // const typeAccount = useRef('Assets')
  const [accountType, setAccountType] = useState<string>("Aset");
  const getButtonClass = (option: "Aset"|"Kewajiban"|"Ekuitas"|"Pendapatan"|"Harga Pokok Penjualan"|"Beban"|"Pendapatan Lainnya"|"Beban Lainnya") =>
    accountType === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";
  
  const changeAccountType = (newValue: string) => {  
    setAccountType(newValue)
    if (newValue) {  
      // typeAccount.current  = newValue;   
      createEventLog(cookies.get('name')!, '/jurnal/account-lainnya', 'table|tab-category', 'change', newValue)
      filterData(allData!, newValue)
    }
  };   
  
  // global function
  useEffect(() => {  
    if (!initializedMetadata.current) {
        initializedMetadata.current = true 
        fetchAll()  
    } 

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  async function fetchAll() {   
    setloadingData(true); 
    await fetch('/api/jurnal/account/all').then((response) => {
        if (response.status >= 500 && response.status < 600) {
            toast.error(response.statusText)
        }  
        return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){    
        setAllData(result['data'])
        filterData(result['data'], 'Aset') 

        const dateString = moment(result['metadata']['_last_update']).locale('id').format('LLLL'); 
        setLastUpdate(dateString) 
      } else { 
        toast.error(result['message'])
      } 
      setloadingData(false);
    }).catch((error) => { 
      Sentry.captureException(error); 
      setloadingData(false);
    });
 
  }
 
  function filterData(data: AccountModel[], category: string) { 
    let number = '1-';
    if (category === 'Aset') {
      number = '1-';
    } else if (category === 'Kewajiban') {
      number = '2-';
    } else if (category === 'Ekuitas') {
      number = '3-';
    } else if (category === 'Pendapatan') {
      number = '4-';
    } else if (category === 'Harga Pokok Penjualan') {
      number = '5-';
    } else if (category === 'Beban') {
      number = '6-';
    } else if (category === 'Pendapatan Lainnya') {
      number = '7-';
    } else if (category === 'Beban Lainnya') {
      number = '8-';
    } 

    const temp:AccountModel[] = [];
    let totalAmount:number = 0;
    data.forEach(item => { 
      if (item.number.toLowerCase().startsWith(number)) {
        temp.push(item);
        totalAmount += item.balance_amount;
      }
    }); 
    setFilteredData(temp);
    setTotalAmount(totalAmount);
  }
  
  function convertCurrency(params: number) {
    return params == null ? "" : "Rp. " + params.toLocaleString().replace(/,/g, '.');
  }



  return (
    <div className="space-y-3">  

      <div className="flex flex-wrap justify-end">
          <div className="float-right m-2 flex">
              Update terakhir : {lastUpdate != null ? lastUpdate : ""} 
          </div>
      </div> 
        
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      
        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Account
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Semua account number
            </p>
          </div>  
        </div> 

        <div className="max-w-full overflow-x-auto custom-scrollbar mb-6 mt-5">  
          {
            loadingData || !filteredData ?
            ( 
              <div>
                <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                    <div className="flex items-center w-1/5">
                        <Skeleton height={20} width={100} className=""/>
                    </div>
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
              <div>
                <div className="block xl:flex justify-between mb-2 ">   
                  <div className="relative w-full">  
                    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900  "> 
                      <button
                        onClick={() => changeAccountType("Aset")}
                        className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("Aset")}`}
                      >
                        Aset
                      </button>
                      <button
                        onClick={() => changeAccountType("Kewajiban")}
                        className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("Kewajiban")}`}
                      >
                        Kewajiban
                      </button>
                      <button
                        onClick={() => changeAccountType("Ekuitas")}
                        className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("Ekuitas")}`}
                      >
                        Ekuitas
                      </button>
                      <button
                        onClick={() => changeAccountType("Pendapatan")}
                        className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("Pendapatan")}`}
                      >
                        Pendapatan
                      </button>
                      <button
                        onClick={() => changeAccountType("Harga Pokok Penjualan")}
                        className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("Harga Pokok Penjualan")}`}
                      >
                        Harga Pokok Penjualan
                      </button>
                      <button
                        onClick={() => changeAccountType("Beban")}
                        className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("Beban")}`}
                      >
                        Beban
                      </button>
                      <button
                        onClick={() => changeAccountType("Pendapatan Lainnya")}
                        className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("Pendapatan Lainnya")}`}
                      >
                        Pendapatan Lainnya
                      </button>
                      <button
                        onClick={() => changeAccountType("Beban Lainnya")}
                        className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass("Beban Lainnya")}`}
                      >
                        Beban Lainnya
                      </button>
                    </div>
                  </div>
                </div> 
                <ul className="mt-5">   
                  <div className="flex cursor-pointer items-center px-2 py-2 bg-gray-100 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                        <div className="flex items-center w-1/5">
                            <span className="block text-sm text-gray-400"><b>Kategori</b></span>
                        </div>
                        <div className="flex items-center w-1/5">
                            <span className={`block text-sm text-gray-400`}><b>Nomor Akun</b></span>
                        </div>
                        <div className="flex items-center w-3/5">
                            <span className={`block text-sm text-gray-400`}><b>Nama Akun</b></span>
                        </div>
                        <div className="text-right w-1/5">
                            <span className="block text-sm text-gray-400"><b>Nilai Balance</b></span>
                        </div>
                    </div> 
                    {
                      filteredData?.map((item, index) => ( 
                        <div key={index} className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex items-center w-1/5">
                                <span className="block text-sm text-gray-400">{item.category}</span>
                            </div>
                            <div className="flex items-center w-1/5">
                                <span className={`block text-sm text-gray-400 ml-${item.indent * 2}`}>{item.number}</span>
                            </div>
                            <div className="flex items-center w-3/5">
                                <span className={`block text-sm text-gray-400 ml-${item.indent * 2}`}>{item.name}</span>
                            </div>
                            <div className="text-right w-1/5">
                                <span className="block text-sm text-gray-400">{convertCurrency(item.balance_amount)}</span>
                            </div>
                        </div>  
                      ))
                    } 
                    <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                        <div className="flex items-center w-1/5 gap-3"> 
                          <span className="block text-sm text-gray-400"><b>Total dari Assets</b></span>
                        </div>
                        <div className="flex items-center w-3/5">
                        </div>
                        <div className="w-1/5 text-right">
                            <span className="block text-sm text-gray-400"><b>{convertCurrency(totalAmount!)}</b></span>
                        </div>
                    </div> 
  

                </ul> 
              </div>
            )
          }
        </div>
      
      </div>

        
    </div>
  );
}
