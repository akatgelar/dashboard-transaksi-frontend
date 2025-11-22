/* eslint-disable @typescript-eslint/no-unused-vars */
'use client' 

import ProductDetailTransaksi from "./ProductDetailTransaksi";
import ProductDetailOmset from "./ProductDetailOmset";
import ProductDetailMargin from "./ProductDetailMargin";
import { useEffect, useRef, useState } from "react"; 
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css';    
import { createEventLog } from "@/utils/log";
import { useCookies } from 'next-client-cookies';  

export interface NumberModel {
  product_all: number;  
  product_active: number;  
  product_active_percent: number;  
  transaksi: number;  
  omset: number; 
  margin: number;  
} 
 
export interface TanggalModel {
  tanggal: string;
  transaksi: number;
  omset: number;
  margin: number; 
}
export interface SeriesTanggalModel { 
  name: string,
  data: number[], 
};


export interface ParamProps {
  statusReload: boolean; 
  dateRange: [Date, Date];  
}

export default function ProductDetail({statusReload, dateRange}:ParamProps) { 
  
  const cookies = useCookies();
  
  // tab
  const [productType, setProductType] = useState<string>("AKTIVASI"); 
  const typeProduct = useRef('AKTIVASI')
  const getButtonClassProductType = (option: 'AKTIVASI'|'DATA'|'ECOMMERCE'|'GAME'|'PPOB'|'PULSA'|'TP PULSA'|'VOUCHER') => 
    productType === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  const changeProductType = (newValue: string) => { 
    console.log(newValue)
    setProductType(newValue)
    console.log(productType)
    console.log('=======')
    if (newValue) {  
      typeProduct.current  = newValue;  

      createEventLog(cookies.get('name')!, '/otomax/product', 'detail|product-type', 'change', newValue)
    }
  };  
 
  useEffect(() => {  
    fetchAllData() 

    const interval = setInterval(() => {  
      if (statusReload) { 

      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [dateRange, statusReload]);
   
  
  function fetchAllData() {  
  }

  return ( 
    <div>
     
     {/* tab */}
      <div className="block xl:flex justify-end mb-2 mt-5">   
        <div className="relative">  
          <div className="block xl:flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900  "> 
              <button
                onClick={() => changeProductType("AKTIVASI")}
                className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClassProductType("AKTIVASI")}`}
              >
                AKTIVASI
              </button>
              <button
                onClick={() => changeProductType("DATA")}
                className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClassProductType("DATA")}`}
              >
                DATA
              </button>
              <button
                onClick={() => changeProductType("ECOMMERCE")}
                className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClassProductType("ECOMMERCE")}`}
              >
                ECOMMERCE
              </button>
              <button
                onClick={() => changeProductType("GAME")}
                className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClassProductType("GAME")}`}
              >
                GAME
              </button>
              <button
                onClick={() => changeProductType("PPOB")}
                className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClassProductType("PPOB")}`}
              >
                PPOB
              </button>
              <button
                onClick={() => changeProductType("PULSA")}
                className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClassProductType("PULSA")}`}
              >
                PULSA
              </button>
              <button
                onClick={() => changeProductType("TP PULSA")}
                className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClassProductType("TP PULSA")}`}
              >
                TP PULSA
              </button>
              <button
                onClick={() => changeProductType("VOUCHER")}
                className={`min-w-fit px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClassProductType("VOUCHER")}`}
              >
                VOUCHER
              </button>
            </div> 
        </div> 
      </div> 

      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Product Kategori : <span className="capitalize">{productType}</span>
          </h3>   
        </div>   

        <div className="border-t mt-4">
          <ProductDetailTransaksi statusReload={statusReload} dateRange={dateRange} productType={productType} ></ProductDetailTransaksi>
          <ProductDetailOmset statusReload={statusReload} dateRange={dateRange} productType={productType} ></ProductDetailOmset>
          <ProductDetailMargin statusReload={statusReload} dateRange={dateRange} productType={productType} ></ProductDetailMargin>
        </div>
 
        
      </div>
    </div>
  );

}

