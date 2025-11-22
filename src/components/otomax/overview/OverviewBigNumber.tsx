"use client";  
import { useEffect, useState } from "react";
import { NumericFormat } from 'react-number-format';
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import Badge from "@/components/ui/badge/Badge"; 
import { 
  LineIconCheckCircle, 
  LineIconXmarkCircle, 
  LineIconMinusCircle,  
  LineIconAngleDoubleUp,
  LineIconAngleDoubleDown,  
  LineIconCreditCard, 
  LineIconUserMultiple,  
  LineIconPercent
} from "@/icons/line-icon";      
import moment from 'moment';  
import toast from 'react-hot-toast';
import * as Sentry from "@sentry/browser"; 


export interface OverviewMemberModel { 
  before: number,
  now: number,
  diff_percent: number 
};

export interface OverviewOmsetMarginModel {  
  before: {
      omset: number,
      margin: number, 
  },
  now: {
      omset: number,
      margin: number, 
  },
  diff_percent: {
      omset: number,
      margin: number, 
  } 
};

export interface OverviewTransaksiModel { 
  before: {
      gagal: number,
      proses: number,
      sukses: number,
  },
  now: {
      gagal: number,
      proses: number,
      sukses: number,
  },
  diff_percent: {
      gagal: number,
      proses: number,
      sukses: number,
  } 
};
 
export interface ParamProps {
  statusReload: boolean;
  dateRange: [Date, Date]; 
}
  
export default function OverviewBigNumber({statusReload, dateRange}:ParamProps) {  
  
  const [loadingOverviewTransaksi, setLoadingOverviewTransaksi] = useState(true);
  const [overviewTransaksiData, setOverviewTransaksiData] = useState<OverviewTransaksiModel>()
 
  const [loadingOverviewMember, setLoadingOverviewMember] = useState(true);
  const [overviewMemberData, setOverviewMemberData] = useState<OverviewMemberModel>()

  const [loadingOverviewOmsetMargin, setLoadingOverviewOmsetMargin] = useState(true);
  const [overviewOmsetMarginData, setOverviewOmsetMarginData] = useState<OverviewOmsetMarginModel>()
 
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
        fetchOverviewTransaksi()
        fetchOverviewMember()
        fetchOverviewOmsetMargin()
        }
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval) 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, statusReload]);


	const fetchAllData = async () => {   
    fetchOverviewTransaksi() 
    fetchOverviewMember() 
    fetchOverviewOmsetMargin() 
  };
 
  
	async function fetchOverviewTransaksi() { 
    setLoadingOverviewTransaksi(true)  
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
		await fetch('/api/otomax/overview/transaksi?start_date='+paramStartDate+'&end_date='+paramEndDate).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){ 
				setOverviewTransaksiData(result['data'])
			} else { 
        toast.error(result['message'])
      }
      setLoadingOverviewTransaksi(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingOverviewTransaksi(false) 
		});
	}
	
	async function fetchOverviewMember() { 
    setLoadingOverviewMember(true)  
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
		await fetch('/api/otomax/overview/member?start_date='+paramStartDate+'&end_date='+paramEndDate).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){ 
				setOverviewMemberData(result['data'])
			} else { 
        toast.error(result["message"])
      }
      setLoadingOverviewMember(false) 
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingOverviewMember(false) 
		});
	}

	async function fetchOverviewOmsetMargin() {  
    setLoadingOverviewOmsetMargin(true) 
    const paramStartDate = moment(dateRange[0]).format('YYYY-MM-DD')  
    const paramEndDate = moment(dateRange[1]).format('YYYY-MM-DD')  
		await fetch('/api/otomax/overview/omset-margin?start_date='+paramStartDate+'&end_date='+paramEndDate).then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			} 
			return response;
		}).then(async (response) => {
			const result = await response.json()  
			if (result["status"] == true){ 
				setOverviewOmsetMarginData(result['data'])
			} else { 
        toast.error(result["message"])
      }
      setLoadingOverviewOmsetMargin(false)
		}).catch((error) => { 
      Sentry.captureException(error);
      setLoadingOverviewOmsetMargin(false)
		});
	}

  return (
    <div className="rounded-2xl space-y-3 border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
   
        <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Big Number 
            </h3>  
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Angka-angka Penting
            </p>
          </div>  
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-4">
          <div className="col-span-12 xl:col-span-3 space-y-3"> 
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                  <LineIconCheckCircle /> 
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Transaksi <br/>Sukses
                </span> 
              </div>    
              {
                loadingOverviewTransaksi || !overviewTransaksiData ?
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
                        <NumericFormat displayType="text" value={overviewTransaksiData?.now?.sukses} thousandSeparator="." decimalSeparator=","/> 
                      </h4>
                    </div>
                    {
                      overviewTransaksiData?.diff_percent?.sukses > 0 ? 
                      ( 
                        <Badge color="success">
                          <LineIconAngleDoubleUp />
                          <NumericFormat displayType="text" value={overviewTransaksiData?.diff_percent?.sukses} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                        </Badge>
                      ):
                      (
                        overviewTransaksiData?.diff_percent?.sukses < 0 ? 
                        ( 
                          <Badge color="error">
                            <LineIconAngleDoubleDown />
                            <NumericFormat displayType="text" value={overviewTransaksiData?.diff_percent?.sukses} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge>
                        ) :
                        ( 
                          <Badge color="light"> 
                            <NumericFormat displayType="text" value={overviewTransaksiData?.diff_percent?.sukses} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge>
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
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl dark:bg-blue-800">
                  <LineIconMinusCircle/>
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Transaksi <br/>Proses
                </span>
              </div>   
              {
                loadingOverviewTransaksi || !overviewTransaksiData ?
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
												<NumericFormat displayType="text" value={overviewTransaksiData?.now?.proses} thousandSeparator="." decimalSeparator=","/> 
											</h4>
										</div>
										{
											overviewTransaksiData?.diff_percent?.proses > 0 ? 
											( 
												<Badge color="success">
													<LineIconAngleDoubleUp />
													<NumericFormat displayType="text" value={overviewTransaksiData?.diff_percent?.proses} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
												</Badge>
											):
											(
												overviewTransaksiData?.diff_percent?.proses < 0 ? 
												( 
													<Badge color="error">
														<LineIconAngleDoubleDown />
														<NumericFormat displayType="text" value={overviewTransaksiData?.diff_percent?.proses} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
													</Badge>
												) :
												( 
													<Badge color="light"> 
														<NumericFormat displayType="text" value={overviewTransaksiData?.diff_percent?.proses} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
													</Badge>
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
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-xl dark:bg-red-800">
                  <LineIconXmarkCircle />
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Transaksi <br/>Gagal
                </span>
              </div>  
              {
                loadingOverviewTransaksi || !overviewTransaksiData ?
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
												<NumericFormat displayType="text" value={overviewTransaksiData?.now?.gagal} thousandSeparator="." decimalSeparator=","/> 
											</h4>
										</div>
										{
											overviewTransaksiData?.diff_percent?.gagal > 0 ? 
											( 
												<Badge color="success">
													<LineIconAngleDoubleUp />
													<NumericFormat displayType="text" value={overviewTransaksiData?.diff_percent?.gagal} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
												</Badge>
											):
											(
												overviewTransaksiData?.diff_percent?.gagal < 0 ? 
												( 
													<Badge color="error">
														<LineIconAngleDoubleDown />
														<NumericFormat displayType="text" value={overviewTransaksiData?.diff_percent?.gagal} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
													</Badge>
												) :
												( 
													<Badge color="light"> 
														<NumericFormat displayType="text" value={overviewTransaksiData?.diff_percent?.gagal} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
													</Badge>
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
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl dark:bg-gray-800">
                  <LineIconUserMultiple />
                </div> 
                <span className="text-md text-gray-500 dark:text-gray-400">
                  Member <br/>Aktif
                </span>
              </div>  
              {
                loadingOverviewMember|| !overviewMemberData ?
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
												<NumericFormat displayType="text" value={overviewMemberData?.now} thousandSeparator="." decimalSeparator=","/> 
											</h4>
										</div>
										{
											overviewMemberData?.diff_percent > 0 ? 
											( 
												<Badge color="success">
													<LineIconAngleDoubleUp />
													<NumericFormat displayType="text" value={overviewMemberData?.diff_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
												</Badge>
											):
											(
												overviewMemberData?.diff_percent < 0 ? 
												( 
													<Badge color="error">
														<LineIconAngleDoubleDown />
														<NumericFormat displayType="text" value={overviewMemberData?.diff_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
													</Badge>
												) :
												( 
													<Badge color="light"> 
														<NumericFormat displayType="text" value={overviewMemberData?.diff_percent} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
													</Badge>
												)
											)
										}
									</div>
								)
							}
            </div> 
          </div> 

        </div>
  
        <div className="grid grid-cols-12 gap-4 md:gap-4">

          <div className="col-span-12 xl:col-span-5 space-y-3"> 
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl dark:bg-green-800">
                  <LineIconCreditCard /> 
                </div> 
                <span className="text-xl text-gray-500 dark:text-gray-400">
                  Omset
                </span>
              </div>
                { 
                  loadingOverviewOmsetMargin || !overviewOmsetMarginData ?
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
                          <NumericFormat displayType="text" value={overviewOmsetMarginData?.now?.omset} thousandSeparator="." decimalSeparator="," prefix="Rp. "/> 
                        </h4>
                      </div>
                      {
                        overviewOmsetMarginData?.diff_percent?.omset > 0 ? 
                        ( 
                          <Badge color="success">
                            <LineIconAngleDoubleUp />
                            <NumericFormat displayType="text" value={overviewOmsetMarginData?.diff_percent?.omset} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                          </Badge>
                        ):
                        (
                          overviewOmsetMarginData?.diff_percent?.omset < 0 ? 
                          ( 
                            <Badge color="error">
                              <LineIconAngleDoubleDown />
                              <NumericFormat displayType="text" value={overviewOmsetMarginData?.diff_percent?.omset} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                            </Badge>
                          ) :
                          ( 
                            <Badge color="light"> 
                              <NumericFormat displayType="text" value={overviewOmsetMarginData?.diff_percent?.omset} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
                            </Badge>
                          )
                        )
                      }
                    </div>
                  )
                }
            </div> 
          </div>

          <div className="col-span-12 xl:col-span-5 space-y-3"> 
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl dark:bg-blue-800">
                  <LineIconCreditCard/>
                </div> 
                <span className="text-xl text-gray-500 dark:text-gray-400">
                  Margin
                </span>
              </div>
              {
                loadingOverviewOmsetMargin || !overviewOmsetMarginData ?
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
												<NumericFormat displayType="text" value={overviewOmsetMarginData?.now?.margin} thousandSeparator="." decimalSeparator="," prefix="Rp. "/> 
											</h4>
										</div>
										{
											overviewOmsetMarginData?.diff_percent?.margin > 0 ? 
											( 
												<Badge color="success">
													<LineIconAngleDoubleUp />
													<NumericFormat displayType="text" value={overviewOmsetMarginData?.diff_percent?.margin} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
												</Badge>
											):
											(
												overviewOmsetMarginData?.diff_percent?.margin < 0 ? 
												( 
													<Badge color="error">
														<LineIconAngleDoubleDown />
														<NumericFormat displayType="text" value={overviewOmsetMarginData?.diff_percent?.margin} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
													</Badge>
												) :
												( 
													<Badge color="light"> 
														<NumericFormat displayType="text" value={overviewOmsetMarginData?.diff_percent?.margin} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
													</Badge>
												)
											)
										}
									</div>
								)
							}
            </div> 
          </div>
  
          <div className="col-span-12 xl:col-span-2 space-y-3"> 
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-xl dark:bg-red-800">
                  <LineIconPercent/>
                </div> 
                <span className="text-xl text-gray-500 dark:text-gray-400">
                  Rate
                </span>
              </div>
              {
                loadingOverviewOmsetMargin || !overviewOmsetMarginData ?
                (
									<div className="flex items-end justify-between mt-2">  
										<Skeleton height={20} width={100} className=""/> 
									</div>
								) :
								(  
                  <div className="flow lg:flex items-end justify-between">  
										<div>
											<h4 className="mt-2 font-bold text-gray-800 text-title-md dark:text-white/90">
												<NumericFormat displayType="text" value={(overviewOmsetMarginData?.now?.margin / overviewOmsetMarginData?.now?.omset) * 100} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative/> % 
											</h4>
										</div> 
									</div>
								)
							}
            </div> 
          </div>

        </div>
         
    </div>
  );
}
