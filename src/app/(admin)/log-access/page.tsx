import LogAccess from "@/components/log-access/LogAccess";
import PreLoader from "@/components/ui/PreLoader";
import type { Metadata } from "next";   

export const metadata: Metadata = {
  title: "Log Access | Gerbang Digital Nusantara",
  description: "Aplikasi dashboard untuk Gerbang Digital Nusantara",
};
 
export default function Index(this: never) { 
  return (
    <div>
        <PreLoader/>
        <LogAccess></LogAccess>
    </div>
  );
}
