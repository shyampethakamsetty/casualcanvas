import "./../styles/globals.css";
import React from "react";
import { AuthProvider } from "../lib/auth";
import { LayoutWrapper } from "../components/LayoutWrapper";

export const metadata = { 
  title: "CasualCanvas - AI Workflow Builder", 
  description: "CasualCanvas: Professional no-code AI workflow automation platform" 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230ea5e9'><path d='M13 10V3L4 14h7v7l9-11h-7z'/></svg>" />
      </head>
      <body className="h-full bg-gradient-to-br from-secondary-50 to-primary-50 text-secondary-900 antialiased">
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
