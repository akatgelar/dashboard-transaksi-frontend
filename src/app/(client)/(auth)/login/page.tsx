import LoginForm from "@/components/login/LoginForm"; 
import { Metadata } from "next"; 

export const metadata: Metadata = {
  title: "Login | Dashboard Transaksi",
  description: "Aplikasi Dashboard Transaksi",
};

export default function Login() {
  return <LoginForm /> ;
}
