import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MobileShell from "@/components/MobileShell";

const inter = Inter({ subsets: ["latin"], variable: '--font-display' });

export const metadata: Metadata = { 
  title: "Shoper | Global Shopping", 
  description: "Premium global marketplace",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-dark-900 flex justify-center">
        <MobileShell>{children}</MobileShell>
      </body>
    </html>
  );
}