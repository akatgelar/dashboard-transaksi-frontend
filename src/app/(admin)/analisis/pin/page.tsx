import AnalisisPin from "@/components/analisis/pin/AnalisisPin"; 
import PreLoader from "@/components/ui/PreLoader";
import type { Metadata } from "next";   

export const metadata: Metadata = {
  title: "Analisis Pin | Dashboard Transaksi",
  description: "Aplikasi Dashboard Transaksi",
};
 
export default function Index(this: never) { 
  return (
    <div>
      <PreLoader/>
      <AnalisisPin></AnalisisPin>
    </div>
  );
}
