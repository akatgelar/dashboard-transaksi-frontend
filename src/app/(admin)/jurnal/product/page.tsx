import JurnalProduct from "@/components/jurnal/product/JurnalProduct";
import PreLoader from "@/components/ui/PreLoader";
import type { Metadata } from "next";   

export const metadata: Metadata = {
  title: "Home | Gerbang Digital Nusantara",
  description: "Aplikasi dashboard untuk Gerbang Digital Nusantara",
};
 
export default function Index(this: never) { 
  return (
    <div>
      <PreLoader/>
      <JurnalProduct></JurnalProduct>
    </div>
  );
}
