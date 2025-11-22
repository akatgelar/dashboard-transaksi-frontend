import type { Metadata } from "next";   
import Home from "@/components/home/Home";
import PreLoader from "@/components/ui/PreLoader";

export const metadata: Metadata = {
  title: "Home | Gerbang Digital Nusantara",
  description: "Aplikasi dashboard untuk Gerbang Digital Nusantara",
};
 
export default function Index(this: never) { 
  return (
    <div>
      <PreLoader/>
      <Home></Home>
    </div>
  );
}
