import JurnalWarehouse from "@/components/jurnal/warehouse/JurnalWarehouse";
import PreLoader from "@/components/ui/PreLoader";
import type { Metadata } from "next";   

export const metadata: Metadata = {
  title: "Home | Dashboard Transaksi",
  description: "Aplikasi Dashboard Transaksi",
};
 
export default function Index(this: never) { 
  return (
    <div>
      <PreLoader/>
      <JurnalWarehouse></JurnalWarehouse>
    </div> 
  );
}
