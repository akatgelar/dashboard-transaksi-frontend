import { Outfit } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from 'react-hot-toast';
 
import { CookiesProvider } from 'next-client-cookies/server';


const outfit = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <CookiesProvider>
      <html lang="en">
        <body className={`${outfit.variable} dark:bg-gray-900`}>
          <Toaster position="bottom-right" 
            toastOptions={{
              className: '',
              style: {
                border: '1px solid #713200',
                padding: '16px',
                color: '#713200',
                zIndex: 999999999
              },
            }}
          />
          <ThemeProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </CookiesProvider>
  );
}
