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
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); return; }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut();
        setError('Access denied. This account is not an admin.');
        return;
      }

      router.push('/admin');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-full flex flex-col justify-center">
      <div className="mb-8 text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl gold-gradient items-center justify-center mb-4 shadow-lg shadow-gold-500/30">
          <svg className="w-9 h-9 text-dark-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold gold-text">Admin Access</h1>
        <p className="text-gray-400 mt-2 text-sm">Sign in with an administrator account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} className="input-dark" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" required minLength={6} />

        {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

        <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-50">
          {loading ? 'Verifying...' : 'Sign In to Admin Panel'}
        </button>
      </form>

      <button onClick={() => router.push('/login')} className="mt-6 text-sm text-gray-400 hover:text-gold-500 transition-colors text-center w-full">
        ← Back to customer login
      </button>
    </div>
  );
}
