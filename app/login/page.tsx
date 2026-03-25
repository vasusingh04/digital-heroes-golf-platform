'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase'; // Connects to the file you just made!

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setMessage('Loading...');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage('Success! Check your email to confirm your account.');
  };

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    setMessage('Loading...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else window.location.href = '/dashboard'; // Redirects to dashboard on success
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-sans">
      <form className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 flex flex-col gap-4 border border-gray-700">
        <h1 className="text-2xl font-bold text-center mb-2">Platform Access</h1>
        <p className="text-sm text-gray-400 text-center mb-4">Sign in or create an account</p>
        
        <input 
          type="email" 
          placeholder="Email address" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
        
        <div className="flex gap-3 mt-4">
          <button onClick={handleSignIn} className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold transition-colors">
            Log In
          </button>
          <button onClick={handleSignUp} className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-500 p-3 rounded-lg font-semibold transition-colors">
            Sign Up
          </button>
        </div>
        
        {message && <p className="text-sm text-center text-blue-300 mt-4">{message}</p>}
      </form>
    </div>
  );
}