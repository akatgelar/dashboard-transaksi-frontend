import { ThemeProvider } from "@/context/ThemeContext"; 
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-white z-1 dark:bg-gray-900">
      <ThemeProvider>
        <div className="relative flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900">
          {children}  
        </div>
      </ThemeProvider>
    </div>
  );
}
