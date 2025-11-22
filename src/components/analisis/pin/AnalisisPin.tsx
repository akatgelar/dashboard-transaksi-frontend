"use client";
  
import React, { useCallback, useMemo, useRef } from 'react';
import { useEffect, useState } from 'react'
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import PreLoader from "@/components/ui/PreLoader";
import { AllCommunityModule, ColDef, ModuleRegistry, TextFilterModule, RowSelectionModule, RowSelectionOptions, SelectionChangedEvent } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; 
import toast from 'react-hot-toast';
import * as Sentry from "@sentry/browser";
import { LineIconCheckCircle, LineIconCreditCard, LineIconCalendar } from '@/icons/line-icon';
import { NumericFormat } from 'react-number-format'; 
import Switch from '@/components/ui/switch/Switch';
import DateRangePickerComponent from '@wojtekmaj/react-daterange-picker';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css'; 
import { createEventLog } from "@/utils/log";
import { useCookies } from 'next-client-cookies';
import moment from 'moment';

ModuleRegistry.registerModules([AllCommunityModule, TextFilterModule, RowSelectionModule]);

export interface ListProduct {
  operator_kode: string;
  operator_nama: string;
  produk_kode: string;
  produk_nama: string; 
}

export interface InsightBigNumber {
  transaksi: number;
  omset: number;
  margin: number; 
}
 
export default function AnalisisPin() {   

  const cookies = useCookies();
  const initializedOverview = useRef(false)
  const [statusReload, setStatusReload] = useState(false); 

  const now = new Date();
  const dateStart = new Date(now.getFullYear(), 1, 1);
  const dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startDate = useRef(moment(dateStart).format('YYYY-MM-DD'))
  const endDate = useRef(moment(dateEnd).format('YYYY-MM-DD'))
  const [dateRange, setDateRange] = useState<[Date, Date]>([dateStart, dateEnd]);
    

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const column:any = [];
  const data:any = []
  const defaultColDef: ColDef = {
    flex: 1,
  };

  const [loadingListProduct, setLoadingListProduct] = useState(true);
  const [dataListProduct, setDataListProduct] = useState<any[]>(data);
  const [columnListProduct, setColumnListProduct] = useState<any[]>(column);  
  const [selectedProduct, setSelectedProduct] = useState<ListProduct[]>();
  const rowSelection = useMemo<RowSelectionOptions | "single" | "multiple">(() => {
    return { mode: "multiRow", headerCheckbox: false };
  }, []);
  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {  
    const temp: any = [];
    event.selectedNodes!.forEach(element => { 
      temp.push(element.data);
    });
    setSelectedProduct(temp);
    
  }, []); 

  const [loadingBigNumber, setLoadingBigNumber] = useState(false);
  const [dataBigNumber, setDataBigNumber] = useState<InsightBigNumber>({transaksi: 0, omset:0, margin: 0});

  const [loadingSeries, setLoadingSeries] = useState(false);
  const [rowSeries, setRowSeries] = useState<any[]>(data);
  const [columnSeries, setColumnSeries] = useState<any[]>(column);  

  // onload  
  useEffect(() => {
    if (!initializedOverview.current) {
      initializedOverview.current = true 
      fetchListProduct()   
    }

    const interval = setInterval(() => {  
      if (statusReload) {
        fetchInsightBigNumber()
        fetchInsightSeries()
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  })
  
  const changeStatusReload = () => {
      setStatusReload(!statusReload);

      createEventLog(cookies.get('name')!, '/analisis/pin', 'metadata|status-reload', 'change',  statusReload.toString())
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const changeDateRange = async (newValue) => { 
      setDateRange(newValue)
      if (newValue){
          startDate.current = moment(newValue[0]).format('YYYY-MM-DD')  
          endDate.current = moment(newValue[1]).format('YYYY-MM-DD')  
          createEventLog(cookies.get('name')!, '/analisis/pin', 'metadata|datepicker', 'change', newValue)
      }
  };
  
  async function fetchListProduct() {
    setLoadingListProduct(true)    
		await fetch('/api/analisis/pin/list-product').then((response) => {
      if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){   
        const tempColumn:any = []
        const filterParams={
          filterOptions:[
            'contains',    
          ],
          suppressAndOrCondition: true
        }
        // tempColumn.push({field: 'operator_kode', headerName: 'Kode Operator', maxWidth: 100, filter: true, floatingFilter: true, filterParams: filterParams});
        tempColumn.push({field: 'operator_nama', headerName: 'Nama Operator', width: 100, filter: true, floatingFilter: true, filterParams: filterParams});
        tempColumn.push({field: 'produk_kode', headerName: 'Kode Produk', width: 100, filter: true, floatingFilter: true, filterParams: filterParams});
        tempColumn.push({field: 'produk_nama', headerName: 'Nama Produk', minWidth: 200, filter: true, floatingFilter: true, filterParams: filterParams});
        setColumnListProduct(tempColumn);
        setDataListProduct(result['data']) 
			} else { 
        toast.error(result["message"])
      }
      setLoadingListProduct(false) 
		}).catch((error) => {  
      Sentry.captureException(error);
      setLoadingListProduct(false) 
		});
  }
   
  
  async function fetchInsightBigNumber() {
    setLoadingBigNumber(true)     
    const selectedProductQuote = selectedProduct?.map(item => `'${item.produk_kode}'`);
    const listProduct = selectedProductQuote?.join(',');  
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
		await fetch('/api/analisis/pin/big-number?list_product='+listProduct+'&start_date='+paramStartDate+'&end_date='+paramEndDate).then((response) => {
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
      setLoadingBigNumber(false) 
		}).catch((error) => {  
      Sentry.captureException(error);
      setLoadingBigNumber(false) 
		});
  }
   
  
  async function fetchInsightSeries() { 
		setLoadingSeries(true)     
    const selectedProductQuote = selectedProduct?.map(item => `'${item.produk_kode}'`);
    const listProduct = selectedProductQuote?.join(',');  
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
		await fetch('/api/analisis/pin/series?list_product='+listProduct+'&start_date='+paramStartDate+'&end_date='+paramEndDate).then((response) => {
      if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){    
        const tempColumn:any = [] 
        tempColumn.push({field: 'tanggal', headerName: 'Tanggal', minWidth: 120, filter: true});
        tempColumn.push({field: 'transaksi', headerName: 'Hit', minWidth: 100, filter: true});
        tempColumn.push({field: 'omset', headerName: 'Omset', minWidth: 150, filter: true});
        tempColumn.push({field: 'margin', headerName: 'Margin', minWidth: 150, filter: true});
        setColumnSeries(tempColumn);
        setRowSeries(result['data']) 
			} else { 
        toast.error(result["message"])
      }
      setLoadingSeries(false) 
		}).catch((error) => {  
      Sentry.captureException(error);
      setLoadingSeries(false) 
		});
  }
   
  async function getInsight() { 
    fetchInsightBigNumber()
    fetchInsightSeries()
    const list_product = selectedProduct?.map(item => `${item.produk_kode}`);
    createEventLog(cookies.get('name')!, '/analisis/pin', 'get-insight|button', 'click',  list_product!.toString())
  }
  
  return (
    <div>
      <PreLoader/>
      <div className="space-y-3"> 

        <div className="grid grid-cols-12 gap-4 md:gap-4 mt-4"> 

            <div className="col-span-6 xl:col-span-6 space-y-3">  
              <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                
                <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
                  <div className="w-full">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      Pin Analisis 
                    </h3>  
                    <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                      Pilih satu atau lebih produk untuk dipantau
                    </p>
 

                    <div className='mt-4'></div>

                    <div className="block xl:flex justify-between mb-2 ">     
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
 
                    {
                      loadingListProduct ?
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
                        <div style={{ width: "100%", height: "600px" }}>
                            <AgGridReact
                              rowData={dataListProduct}
                              columnDefs={columnListProduct}
                              defaultColDef={defaultColDef}
                              rowSelection={rowSelection} 
                              onSelectionChanged={onSelectionChanged}
                            />
                        </div> 
                      )
                    }   

                    <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                      List Product : 
                    </h3>   
                    <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">      
                      {
                        selectedProduct?.map((item, index) => ( 
                          <span key={index} className="mr-2 mt-1 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                            {item.produk_kode} - {item.produk_nama}
                          </span> 
                        ))
                      }       
                    </p>
                    <button type="submit" onClick={() => getInsight()} className="mt-4 w-full p-3 text-sm font-medium text-white transition-colors rounded-lg bg-brand-500 hover:bg-brand-600">
                      Lihat Insight
                    </button> 
 
                  </div>  
                </div> 

              </div>
 
            </div>

            <div className="col-span-6 xl:col-span-6 space-y-3">  
              <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">

                  <div className="w-full">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      Insight
                    </h3>  
                    <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                      Sesuai dengan produk yang dipilih
                    </p>
                  </div>

                  <div>
                    {
                      loadingBigNumber  ?
                      (
                        <div className="mt-2">  
                          <Skeleton height={20} className="mt-2"/>
                          <Skeleton height={20} className="mt-2"/>
                          <Skeleton height={20} className="mt-2"/>
                        </div>
                      )
                      :
                      (
                        <div className="grid grid-cols-12 gap-4 md:gap-2 mt-4">
                          <div className="col-span-12 xl:col-span-12 space-y-2"> 
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
                              
                              <div className="flow lg:flex items-end justify-between">  
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-xl dark:bg-green-800">
                                    <LineIconCheckCircle /> 
                                  </div> 
                                  <span className="text-md text-gray-500 dark:text-gray-400">
                                    Hit 
                                  </span> 
                                </div>    
                                <div> 
                                  <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                                    <NumericFormat displayType="text" value={dataBigNumber!.transaksi} thousandSeparator="." decimalSeparator=","/> 
                                  </h4> 
                                </div>  
                              </div>  
                              
                            </div> 
                          </div>

                          <div className="col-span-12 xl:col-span-12 space-y-2"> 
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
                              
                              <div className="flow lg:flex items-end justify-between">  
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                                    <LineIconCreditCard /> 
                                  </div> 
                                  <span className="text-md text-gray-500 dark:text-gray-400">
                                    Omset
                                  </span> 
                                </div>    
                                <div> 
                                  <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                                    <NumericFormat displayType="text" value={dataBigNumber!.omset} thousandSeparator="." decimalSeparator="," prefix='Rp. '/> 
                                  </h4> 
                                </div>  
                              </div>  
                              
                            </div> 
                          </div>

                          <div className="col-span-12 xl:col-span-12 space-y-2"> 
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
                              
                              <div className="flow lg:flex items-end justify-between">  
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl dark:bg-blue-800">
                                    <LineIconCreditCard/>
                                  </div> 
                                  <span className="text-md text-gray-500 dark:text-gray-400">
                                    Margin
                                  </span> 
                                </div>    
                                <div> 
                                  <h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
                                    <NumericFormat displayType="text" value={dataBigNumber!.margin} thousandSeparator="." decimalSeparator="," prefix='Rp. '/> 
                                  </h4> 
                                </div>  
                              </div>  
                              
                            </div> 
                          </div>
                        </div>
                      )

                    }

                  </div>

                  {
                    loadingSeries ?
                    (
                      <div className="mt-5">  
                        <Skeleton height={20} className="mt-2"/>
                        <Skeleton height={20} className="mt-2"/>
                        <Skeleton height={20} className="mt-2"/>
                      </div>
                    )
                    :
                    (
                      <div className='mt-5' style={{ width: "100%", height: "500px" }}>
                          <AgGridReact
                            rowData={rowSeries}
                            columnDefs={columnSeries}
                            defaultColDef={defaultColDef} 
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
