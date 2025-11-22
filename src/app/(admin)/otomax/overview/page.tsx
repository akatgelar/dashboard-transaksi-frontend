import type { Metadata } from "next";   
import DashboardOverview from "@/components/otomax/overview/DashboardOverview";
import PreLoader from "@/components/ui/PreLoader";

export const metadata: Metadata = {
  title: "Overview | Gerbang Digital Nusantara",
  description: "Aplikasi dashboard untuk Gerbang Digital Nusantara",
};
 
export default function Index(this: never) { 
  return (
    <div>
      <PreLoader/>
      <DashboardOverview></DashboardOverview> 
    </div>
  );
}
