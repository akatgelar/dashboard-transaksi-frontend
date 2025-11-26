import type { Metadata } from "next";   
import DashboardProduct from "@/components/otomax/product/DashboardProduct";
import PreLoader from "@/components/ui/PreLoader";

export const metadata: Metadata = {
  title: "Product | Dashboard Transaksi",
  description: "Aplikasi Dashboard Transaksi",
};
 
export default function Index(this: never) { 
  return (
    <div>
      <PreLoader/>
      <DashboardProduct></DashboardProduct>
    </div>
  );
}
