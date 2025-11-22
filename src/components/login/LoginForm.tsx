'use client'

import Link from "next/link"; 
import Image from "next/image";
import GridShape from "../ui/GridShape";
import { setCookie } from 'cookies-next/client';
import { redirect } from "next/navigation";

export default function LoginForm() { 
  // const clientId = process.env.SSO_CLIENT_ID;
  // const redirect_url = process.env.SSO_REDIRECT_URL;
  // const ssoUrl = "https://sso.gerbangdigitalnusantara.co.id/realms/gdn/protocol/openid-connect/auth?client_id="+clientId+"&redirect_uri="+redirect_url+"&response_type=code"
 
  const setSession = () => { 
    // set session
    setCookie('token', 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ5U0VTLUJvdU1WRW40U0l4a1Q4ODNwQjBfODVNQmxTNmZoc2o3bWtGeHZFIn0.eyJleHAiOjE3NjM3MjE3MDEsImlhdCI6MTc2MzY4NTcwMSwiYXV0aF90aW1lIjoxNzYzNjg1NzAxLCJqdGkiOiJkZDRiMmUyOC1mMWVhLTRjOWMtOWQ4MC04MzAyZjQ3ZmE3Y2YiLCJpc3MiOiJodHRwczovL3Nzby5nZXJiYW5nZGlnaXRhbG51c2FudGFyYS5jby5pZC9yZWFsbXMvZ2RuIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjZlMmRlYmIwLWNiN2YtNDRlYi05NTRhLWRlNDRhNzcyOWQ0MCIsInR5cCI6IkJlYXJlciIsImF6cCI6ImRhc2hib2FyZCIsInNlc3Npb25fc3RhdGUiOiI3ODJiYjdiZC0yNzZkLTRmZmMtOTczMC03ODllYzMzYjdhMjEiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vZGFzaGJvYXJkLmdlcmJhbmdkaWdpdGFsbnVzYW50YXJhLmNvLmlkIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy1nZG4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX0sImRhc2hib2FyZCI6eyJyb2xlcyI6WyJkaXJla3NpIl19fSwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsInNpZCI6Ijc4MmJiN2JkLTI3NmQtNGZmYy05NzMwLTc4OWVjMzNiN2EyMSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6Ik11aGFtYWQgWmFiaWgiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ6YWJpaCIsImdpdmVuX25hbWUiOiJNdWhhbWFkIiwiZmFtaWx5X25hbWUiOiJaYWJpaCJ9.k8LrZGdO20qJ1OT08e3YfzMFqr2TACEnNf2cYY8VEkBzhNSOnQ77iGWXdiJro9BLeAPsj6zn9V6Q8mzJwzYp3Kcwk6gRltDjbqAT37py_PUQm1rlgsgWb7UoNKWBjji5Kjt_pTOG5qe0HqD5yPAcuJowiQdT-e10zOyC-LLaSfbTDEjt7kORL3rm-iRTlaJhOie3BR34Lv67fDlyWIB51mIRbjopOo6kDhYpk3727mLNtjjItmClQYzZSiNH1rvOjWwO6OA8NaaHhZee8Wxstos0_c2gq48ixW2ai6qFZSGGidH_Izv4claGoXV5Al3nD5YI4FAFzNoBD37FjhLjdA');  
    setCookie('name', 'Muhamad Zabih');
    setCookie('email', 'muhamad.zabih@gmail.com');
    setCookie('role', 'direksi');
    setCookie('exp', '1795261252'); 
    redirect('/');
  };

  return ( 
    <div className="lg:w-full w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center">
      <div className="relative items-center justify-center flex z-1"> 
        <GridShape />
        <div className="flex flex-col items-center max-w-xs">
          <Link href="/" className="block mb-4">
            <Image
              width={231}
              height={48}
              src="/images/logo/logo-gdn-192x192.png"
              alt="Logo"
            />
          </Link>
          <p className="text-center text-gray-400 dark:text-white/60">
            Dashboard <br/>Gerbang Digital Nusantara
          </p>
          {/* <Link  
            href={ssoUrl}
            className="mt-2 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">
            Login With SSO
          </Link> */}
          <button
            onClick={() => setSession()} 
            className="mt-2 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
