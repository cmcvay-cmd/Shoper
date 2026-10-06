'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check credentials match
    if (email !== 'cmcvayhomes@gmail.com' || password !== 'Grinder$$1290') {
      setError('Invalid credentials');
      setLoading(false);
      return;
    }

    try {
      // Try to login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If login fails, the account might not exist yet
        // Create it and set as admin
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: 'Admin', username: 'admin' } }
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (signUpData.user) {
          // Set admin role
          await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            role: 'admin',
            full_name: 'Admin',
            username: 'admin'
          }, { onConflict: 'id' });
          
          router.push('/admin');
        }
      } else if (data.user) {
        // Login successful - verify admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        // Ensure admin role is set
        if (!profile || profile.role !== 'admin') {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            role: 'admin'
          }, { onConflict: 'id' });
        }

        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-900">
      <div className="w-full max-w-md glass-card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full gold-gradient flex items-center justify-center">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark"
              defaultValue="cmcvayhomes@gmail.com"
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
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full disabled:opacity-50"
          >
            {loading ? 'Please wait...' : 'Access Admin Panel'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gold-500 hover:text-gold-400">
            ← Back to Store
          </a>
        </div>
      </div>
    </div>
  );
}