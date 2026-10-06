import Link from "next/link";
import { User } from "@supabase/supabase-js";

export default function Header({ user, isAdmin }: { user: User | null, isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-dark-900/90 backdrop-blur-xl border-b border-gold-900/30">
      <div className="w-full px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-gold-sm">
            <span className="text-dark-900 font-display font-bold text-sm">S</span>
          </div>
          <span className="font-display font-semibold text-lg tracking-wide text-gold-300 hidden xs:block">Shoper</span>
        </Link>

        {/* Admin Badge */}
        {isAdmin && (
          <Link href="/admin" className="px-2.5 py-1 bg-gold-500/10 border border-gold-500/30 rounded-lg text-[10px] font-semibold text-gold-500 uppercase tracking-wider">
            Admin
          </Link>
        )}

        {/* Profile / Login */}
        {user ? (
          <Link href="/profile" className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-dark-900 font-bold text-xs">
            {user.email?.[0].toUpperCase()}
          </Link>
        ) : (
          <Link href="/login" className="px-4 py-1.5 gold-gradient rounded-full text-dark-900 text-xs font-bold">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}