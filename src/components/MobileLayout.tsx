import { createClient } from "@/lib/supabase/server";
import BottomNav from "./BottomNav";
import SplashScreen from "./SplashScreen";
import Link from "next/link";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from('profiles').select('is_admin').eq('id', user.id).single() : { data: null };

  return (
    <div className="app-container">
      <SplashScreen />
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
          SHOPER
        </Link>
        <div className="flex gap-3">
          {user && profile?.is_admin && (
            <Link href="/admin" className="text-xs font-semibold text-red-600">Admin</Link>
          )}
          {user ? (
            <Link href="/profile" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
              {user.email?.[0].toUpperCase()}
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-amber-600">Login</Link>
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