'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup' | 'guest'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, username: email.split('@')[0] } }
        });
        if (error) setError(error.message);
        else { router.push('/'); router.refresh(); }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        else { router.push('/'); router.refresh(); }
      }
    } finally { setLoading(false); }
  };

  const handleGuest = async () => {
    setLoading(true);
    const guestEmail = `guest_${Date.now()}@shoper.app`;
    const guestPass = 'guest123456';
    const { error } = await supabase.auth.signUp({
      email: guestEmail, password: guestPass,
      options: { data: { full_name: 'Guest User', username: 'guest' } }
    });
    setLoading(false);
    if (error) setError(error.message);
    else { router.push('/'); router.refresh(); }
  };

  return (
    <div className="p-6 min-h-full flex flex-col justify-center">
      <div className="mb-8 text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl gold-gradient items-center justify-center mb-4 shadow-lg shadow-gold-500/30">
          <svg className="w-9 h-9 text-dark-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold gold-text">Welcome to Shoper</h1>
        <p className="text-gray-400 mt-2 text-sm">Premium global shopping experience</p>
      </div>

      {mode !== 'guest' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className="input-dark" required />
          )}
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="input-dark" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" required minLength={6} />
          
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
          
          <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-50">
            {loading ? 'Please wait...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-3">
        <button onClick={handleGuest} disabled={loading} className="btn-outline-gold w-full disabled:opacity-50 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Continue as Guest
        </button>
        
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-dark-600" />
          <span className="text-xs text-gray-500">OR</span>
          <div className="flex-1 h-px bg-dark-600" />
        </div>

        <div className="text-center text-sm text-gray-400">
          {mode === 'login' ? (
            <>New to Shoper? <button onClick={() => { setMode('signup'); setError(''); }} className="text-gold-500 font-semibold">Create account</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }} className="text-gold-500 font-semibold">Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}