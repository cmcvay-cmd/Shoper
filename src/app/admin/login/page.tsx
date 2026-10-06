'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Hardcoded admin credentials
const ADMIN_EMAIL = 'cmcvayhomes@gmail.com';
const ADMIN_PASSWORD = 'Grinder$$1290';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setError('Invalid admin credentials');
      setLoading(false);
      return;
    }

    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // If user doesn't exist, create admin account
      if (error.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: 'Admin User',
              username: 'admin'
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          // Set admin role in profiles table
          const { data: newUser } = await supabase.auth.getUser();
          if (newUser.user) {
            await supabase
              .from('profiles')
              .upsert({ 
                id: newUser.user.id, 
                role: 'admin',
                full_name: 'Admin User',
                username: 'admin'
              });
            
            // Auto login after signup
            await supabase.auth.signInWithPassword({ email, password });
            router.push('/admin');
          }
        }
      } else {
        setError(error.message);
      }
    } else if (data.user) {
      // Verify user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'admin') {
        router.push('/admin');
      } else {
        setError('Access denied. Not an admin account.');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-900">
      <div className="w-full max-w-md glass-card p-8 animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full gold-gradient flex items-center justify-center shadow-gold-lg">
            <svg className="w-8 h-8 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gold-text mb-2">Admin Panel</h1>
          <p className="text-gray-400 text-sm">Shoper Marketplace Administration</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark"
              placeholder="admin@shoper.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Access Admin Panel'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
          <p className="text-xs text-gray-500 text-center mb-2">Default Admin Credentials</p>
          <p className="text-xs text-gold-500 font-mono text-center break-all">cmcvayhomes@gmail.com</p>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gold-500 hover:text-gold-400 transition-colors">
            ← Back to Store
          </a>
        </div>
      </div>
    </div>
  );
}