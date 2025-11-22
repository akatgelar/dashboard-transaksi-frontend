import Link from "next/link"; 
import Image from "next/image";
import GridShape from "../ui/GridShape";

export default function LoginForm() { 
  const clientId = process.env.SSO_CLIENT_ID;
  const redirect_url = process.env.SSO_REDIRECT_URL;
  const ssoUrl = "https://sso.gerbangdigitalnusantara.co.id/realms/gdn/protocol/openid-connect/auth?client_id="+clientId+"&redirect_uri="+redirect_url+"&response_type=code"

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
          <Link  
            href={ssoUrl}
            className="mt-2 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">
            Login With SSO
          </Link>
        </div>
      </div>
    </div>
  );
}
