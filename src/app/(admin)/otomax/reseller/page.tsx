import type { Metadata } from "next";    
import DashboardReseller from "@/components/otomax/reseller/DashboardReseller";
import PreLoader from "@/components/ui/PreLoader";

export const metadata: Metadata = {
  title: "Reseller | Dashboard Transaksi",
  description: "Aplikasi Dashboard Transaksi",
};
 
export default function Index(this: never) { 
  return (
    <div>
      <PreLoader/>
      <DashboardReseller></DashboardReseller>
    </div>
  );
}
