import Link from "next/link";
import { User } from "@supabase/supabase-js";

export default function Header({ user, isAdmin }: { user: User | null, isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-xl border-b border-dark-600 px-4 py-3 flex justify-between items-center">
      <Link href="/" className="flex items-center gap-2">
        <svg className="w-7 h-7 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-xl font-bold gold-text tracking-wide">SHOPER</span>
      </Link>
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link href="/admin" className="px-3 py-1.5 bg-gold-500/10 border border-gold-500/30 rounded-lg text-xs font-semibold text-gold-500">
            Admin
          </Link>
        )}
        {user ? (
          <Link href="/profile" className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-dark-900 font-bold text-sm">
            {user.email?.[0].toUpperCase()}
          </Link>
        ) : (
          <Link href="/login" className="px-4 py-1.5 gold-gradient rounded-lg text-dark-900 text-sm font-bold">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}