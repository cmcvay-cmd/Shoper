import { createClient } from "@/lib/supabase/server";
import BottomNav from "./BottomNav";
import SplashScreen from "./SplashScreen";
import Link from "next/link";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="app-container">
      <SplashScreen />
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-gold-500 to-amber-600 bg-clip-text text-transparent">
          SHOPER
        </Link>
        <div className="flex gap-3">
          {user ? (
            <Link href="/profile" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
              {user.email?.[0].toUpperCase()}
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-blue-600">Login</Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      {user && <BottomNav />}
    </div>
  );
}