import LogoutForm from "@/components/logout/LogoutForm"; 
import { Metadata } from "next"; 

export const metadata: Metadata = {
  title: "Logout | Dashboard Transaksi",
  description: "Aplikasi Dashboard Transaksi",
};

export default function Logout() {
  return <LogoutForm /> ;
}
