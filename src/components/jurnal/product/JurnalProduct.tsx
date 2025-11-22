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
   
export interface ProductModel { 
  id: number,
  category: string, 
  code: string, 
  name: string, 
  unit: string, 
  quantity: number,  
  buy_price: number,  
  averate_price: number,  
};

export default function JurnalProduct() { 
 
  const cookies = useCookies();

  // metadata
  const initializedMetadata = useRef(false)
  const [lastUpdate, setLastUpdate] = useState<string>("");
   
  // account
  const [loadingData, setloadingData] = useState(true); 
  const [categoryData, setCategoryData] = useState<string[]>()
  const [allData, setAllData] = useState<ProductModel[]>()
  const [filteredData, setFilteredData] = useState<ProductModel[]>()
  const [totalQuantity, setTotalQuantity] = useState<number>()
  const [totalBuyPrice, setTotalBuyPrice] = useState<number>()
  const [totalAveragePrice, setTotalAveragePrice] = useState<number>()

  // tab 
  // const typeAccount = useRef('Assets')

  type AccountOption =
  | "Unassigned"
  | "DIGIPOS"
  | "GIFT ISAT"
  | "GS"
  | "H2H"
  | "MOBO"
  | "SIDOMPUL"
  | "TP ISAT"
  | "TP TSEL"
  | "VOUCHER ISAT"
  | "VOUCHER SMARTFREN"
  | "VOUCHER TSEL"
  | "VOUCHER XL";

  const [accountType, setAccountType] = useState<string>("Unassigned"); 
  const getButtonClass = (option: AccountOption) =>
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
        setCategoryData([ "Unassigned","DIGIPOS","GIFT ISAT","GS","H2H","MOBO","SIDOMPUL","TP ISAT","TP TSEL","VOUCHER ISAT","VOUCHER SMARTFREN","VOUCHER TSEL","VOUCHER XL"])
        fetchAll()  
    } 

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  async function fetchAll() {   
    setloadingData(true); 
    await fetch('/api/jurnal/product/all').then((response) => {
        if (response.status >= 500 && response.status < 600) {
            toast.error(response.statusText)
        }  
        return response;
    }).then(async (response) => {
      const result = await response.json()  
      if (result["status"] == true){    
        setAllData(result['data'])
        filterData(result['data'], 'Unassigned') 

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
 
  function filterData(data: ProductModel[], category: string) {  
    const temp:ProductModel[] = [];
    let totalQuantity:number = 0;
    let totalBuyPrice:number = 0;
    let totalAveragePrice:number = 0;
    data.forEach(item => { 
      if (item.category === category) {
        temp.push(item);
        totalQuantity += item.quantity;
        totalBuyPrice += item.buy_price;
        totalAveragePrice += item.averate_price;
      }
    }); 
    setFilteredData(temp);
    setTotalQuantity(totalQuantity);
    setTotalBuyPrice(totalBuyPrice);
    setTotalAveragePrice(totalAveragePrice);
  }
  
  function convertCurrency(params: number) {
    return params == null ? "" : "Rp. " + params.toLocaleString().replace(/,/g, '.');
  }
  
  function convertThousand(params: number) {
    return params == null ? "" : "" + params.toLocaleString().replace(/,/g, '.');
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
              Product
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Semua product
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
                    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900 overflow-x-scroll pb-3">  
                    {
                      categoryData?.map((item, index) => ( 
                        <button key={index} 
                          onClick={() => changeAccountType(item)}
                          className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(item as AccountOption)}`}
                        >
                          {item}
                        </button>
                      ))
                    } 
                    </div>
                  </div>
                </div> 
                <ul className="mt-5">   
                  <div className="flex cursor-pointer items-center px-2 py-2 bg-gray-100 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                        <div className="flex items-center w-1/12">
                            <span className="block text-sm text-gray-400"><b>Kategori</b></span>
                        </div>
                        <div className="flex items-center w-5/12">
                            <span className={`block text-sm text-gray-400`}><b>Kode & Nama</b></span>
                        </div> 
                        <div className="text-right w-1/12">
                            <span className={`block text-sm text-gray-400`}><b>Quantity</b></span>
                        </div>
                        <div className="text-right w-1/12">
                            <span className="block text-sm text-gray-400"><b>Unit</b></span>
                        </div>
                        <div className="text-right w-2/12">
                            <span className="block text-sm text-gray-400"><b>Buy Price</b></span>
                        </div>
                        <div className="text-right w-2/12">
                            <span className="block text-sm text-gray-400"><b>Average Price</b></span>
                        </div>
                    </div> 
                    {
                      filteredData?.map((item, index) => ( 
                        <div key={index} className="flex cursor-pointer  px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                            <div className="flex  w-1/12">
                                <span className="block text-sm text-gray-400">{item.category}</span>
                            </div>
                            <div className="flex items-center w-5/12">
                                <span className={`block text-sm text-gray-400`}>{item.name} <br/><b>{item.code}</b></span>
                            </div> 
                            <div className="text-right w-1/12">
                                <span className="block text-sm text-gray-400">{convertThousand(item.quantity)}</span>
                            </div>
                            <div className="text-right w-1/12">
                                <span className={`block text-sm text-gray-400`}>{item.unit}</span>
                            </div> 
                            <div className="text-right w-2/12">
                                <span className="block text-sm text-gray-400">{convertCurrency(item.buy_price)}</span>
                            </div>
                            <div className="text-right w-2/12">
                                <span className="block text-sm text-gray-400">{convertCurrency(item.averate_price)}</span>
                            </div>
                        </div>  
                      ))
                    } 
                    <div className="flex cursor-pointer items-center px-2 py-2 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                        <div className="flex items-center w-1/12 gap-12">  
                        </div> 
                        <div className="flex items-center w-5/12">
                          <span className="block text-sm text-gray-400"><b>Total </b></span>
                        </div> 
                        <div className="w-1/12 text-right">
                            <span className="block text-sm text-gray-400"><b>{convertThousand(totalQuantity!)}</b></span>
                        </div>
                        <div className="w-1/12 text-left"> 
                        </div>
                        <div className="w-2/12 text-right">
                            <span className="block text-sm text-gray-400"><b>{convertCurrency(totalBuyPrice!)}</b></span>
                        </div>
                        <div className="w-2/12 text-right">
                            <span className="block text-sm text-gray-400"><b>{convertCurrency(totalAveragePrice!)}</b></span>
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
