'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, username: email.split('@')[0] } }
      });
      if (error) setError(error.message);
      else router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-3 border rounded-lg" required />
        )}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" required minLength={6} />
        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-semibold">
          {isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 ml-1 font-semibold">
          {isSignUp ? 'Log In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}