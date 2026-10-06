import { createClient } from "@/lib/supabase/server";
import BottomNav from "./BottomNav";
import SplashScreen from "./SplashScreen";
import Header from "./Header";

export default async function MobileShell({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user role from profiles table
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
  }

  return (
    <div className="min-h-screen bg-dark-900 flex justify-center">
      <div className="w-full max-w-md bg-dark-900 min-h-screen flex flex-col relative">
        <SplashScreen />
        <Header user={user} isAdmin={isAdmin} />
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>
        {user && <BottomNav isAdmin={isAdmin} />}
      </div>
    </div>
  );
}