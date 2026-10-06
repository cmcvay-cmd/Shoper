export default function Header({ user, isAdmin }: { user: User | null, isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-dark-900/90 backdrop-blur-xl border-b border-gold-900/30">
      <div className="w-full px-4 h-14 flex items-center justify-between gap-3">
        {/* ... header content */}
      </div>
    </header>
  );
}