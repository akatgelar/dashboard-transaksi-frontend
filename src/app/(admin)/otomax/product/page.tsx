import type { Metadata } from "next";   
import DashboardProduct from "@/components/otomax/product/DashboardProduct";
import PreLoader from "@/components/ui/PreLoader";

export const metadata: Metadata = {
  title: "Product | Gerbang Digital Nusantara",
  description: "Aplikasi dashboard untuk Gerbang Digital Nusantara",
};
 
export default function Index(this: never) { 
  return (
    <div>
      <PreLoader/>
      <DashboardProduct></DashboardProduct>
    </div>
  );
}
