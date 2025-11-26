import JurnalProfitLoss from "@/components/jurnal/profit-loss/JurnalProfitLoss";
import type { Metadata } from "next";    
import PreLoader from "@/components/ui/PreLoader";

export const metadata: Metadata = {
  title: "Jurnal Profit & Loss | Dashboard Transaksi",
  description: "Aplikasi Dashboard Transaksi",
};
  
export default function Index(this: never) { 
 
  return (
    <div>
      <PreLoader/>
      <JurnalProfitLoss></JurnalProfitLoss>
    </div>
  );
}
