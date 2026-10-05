import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Navbar() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from('profiles').select('is_admin').eq('id', user.id).single() : { data: null };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">SHOPER</Link>
        <div className="flex items-center space-x-6">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          {user ? (
            <>
              <Link href="/cart" className="hover:text-blue-600">Cart</Link>
              <Link href="/chat" className="hover:text-blue-600">Chat</Link>
              {profile?.is_admin && <Link href="/admin" className="text-red-600 font-semibold">Admin</Link>}
              <form action="/auth/signout" method="post">
                <button type="submit" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Logout</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}