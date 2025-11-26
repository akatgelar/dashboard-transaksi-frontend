import type { Metadata } from "next";   
import Home from "@/components/home/Home";
import PreLoader from "@/components/ui/PreLoader";

export const metadata: Metadata = {
  title: "Home | Dashboard Transaksi",
  description: "Aplikasi Dashboard Transaksi",
};
 
export default function Index(this: never) { 
  return (
    <div>
      <PreLoader/>
      <Home></Home>
    </div>
  );
}
