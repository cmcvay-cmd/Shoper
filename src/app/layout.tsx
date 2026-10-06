import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import MobileShell from "@/components/MobileShell";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: '--font-sans' 
});

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: '--font-display',
  weight: ['500', '600', '700']
});

export const metadata: Metadata = { 
  title: "Shoper Marketplace | Premium Global Shopping", 
  description: "Curated luxury from sellers worldwide",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className={`${inter.className} bg-dark-900 text-white font-sans antialiased h-full flex justify-center`}>
        <MobileShell>{children}</MobileShell>
      </body>
    </html>
  );
}
