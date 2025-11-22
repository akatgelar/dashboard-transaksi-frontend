import type { Metadata } from "next";    
import DashboardModul from "@/components/otomax/modul/DashboardModul";
import PreLoader from "@/components/ui/PreLoader";

export const metadata: Metadata = {
  title: "Modul | Gerbang Digital Nusantara",
  description: "Aplikasi dashboard untuk Gerbang Digital Nusantara",
};

export default function Index(this: never) { 
  return (
    <div> 
      <PreLoader/> 
      <DashboardModul></DashboardModul>
    </div>
  );
}
