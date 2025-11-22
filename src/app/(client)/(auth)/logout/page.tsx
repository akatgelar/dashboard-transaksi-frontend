import LogoutForm from "@/components/logout/LogoutForm"; 
import { Metadata } from "next"; 

export const metadata: Metadata = {
  title: "Logout | Gerbang Digital Nusantara",
  description: "Aplikasi dashboard untuk Gerbang Digital Nusantara",
};

export default function Logout() {
  return <LogoutForm /> ;
}
