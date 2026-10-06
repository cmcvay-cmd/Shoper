import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import MobileShell from "@/components/MobileShell";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: '--font-display',
  weight: ['500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = { 
  title: "Shoper Marketplace | Premium Global Shopping", 
  description: "Curated luxury from sellers worldwide",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-dark-900 text-white font-sans antialiased">
        <MobileShell>{children}</MobileShell>
      </body>
    </html>
  );
}