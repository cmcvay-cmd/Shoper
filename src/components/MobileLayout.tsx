import { createClient } from "@/lib/supabase/server";
import BottomNav from "./BottomNav";
import SplashScreen from "./SplashScreen";
import Header from "./Header";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user role to determine admin status
  const profile = user 
    ? (await supabase.from('profiles').select('role').eq('id', user.id).single()).data 
    : null;
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="app-shell">
      <SplashScreen />
      <Header user={user} isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
      
      {/* Pass isAdmin prop to BottomNav */}
      {user && <BottomNav isAdmin={isAdmin} />}
    </div>
  );
}
