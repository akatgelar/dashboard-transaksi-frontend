"use client"
import { redirect } from "next/navigation";
import React, { useEffect } from "react";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

export default function ErrorNotAllowed() {
  useEffect(() => {
    const alert = withReactContent(Swal) 
    alert.fire({
      title: "Error Session",
      text: "You don't have access to this page",
      icon: "error", 
    }).then(() => { 
      redirect('/login');
    })
  }, []);
  
  return (
    <div></div>
  );
}
