import type { Metadata } from "next";    
import DashboardReseller from "@/components/otomax/reseller/DashboardReseller";
import PreLoader from "@/components/ui/PreLoader";

export const metadata: Metadata = {
  title: "Reseller | Gerbang Digital Nusantara",
  description: "Aplikasi dashboard untuk Gerbang Digital Nusantara",
};
 
export default function Index(this: never) { 
  return (
    <div>
      <PreLoader/>
      <DashboardReseller></DashboardReseller>
    </div>
  );
}
