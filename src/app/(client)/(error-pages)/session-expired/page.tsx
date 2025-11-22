"use client"
import { redirect } from "next/navigation";
import React, { useEffect } from "react";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

export default function ErroSessionExpired() {
  useEffect(() => {
    const alert = withReactContent(Swal) 
    alert.fire({
      title: "Error Session",
      text: "Session expired, please re-login",
      icon: "error", 
    }).then(() => { 
      redirect('/login');
    })
  }, []);
  
  return (
    <div></div>
  );
}
