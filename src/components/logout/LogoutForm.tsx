'use client';
import { deleteCookie } from 'cookies-next/client';
import { redirect } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast"; 
import * as Sentry from "@sentry/browser";

export default function LoginForm() { 
  useEffect(() => {   
    logout()
    redirect('/login');
  });

  async function logout() { 
    await fetch('/api/auth/logout').then((response) => {
      if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}
			return response;
		})
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .then((result) => {
      deleteSession()
    })
    .catch((error) => {  
      Sentry.captureException(error); 
		});
  }

  function deleteSession() {
    deleteCookie('token') 
    deleteCookie('refresh_token') 
    deleteCookie('name')
    deleteCookie('email')
    deleteCookie('role')
    deleteCookie('exp')
  }

  return ( 
    <div>
    </div>
  );
}
