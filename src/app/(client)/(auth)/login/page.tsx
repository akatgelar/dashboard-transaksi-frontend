import LoginForm from "@/components/login/LoginForm"; 
import { Metadata } from "next"; 

export const metadata: Metadata = {
  title: "Login | Gerbang Digital Nusantara",
  description: "Aplikasi dashboard untuk Gerbang Digital Nusantara",
};

export default function Login() {
  return <LoginForm /> ;
}
