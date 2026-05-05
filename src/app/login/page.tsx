'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Lock, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Give a small delay to simulate server check
    setTimeout(() => {
      const success = login(email, password);
      
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 p-8 lg:p-12">
        
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="mb-4 drop-shadow-lg">
            <img src="/logo.png" alt="MOCAAD Logo" className="w-56 h-auto object-contain" />
          </div>
          <h1 className="text-xl font-[900] text-slate-950 uppercase tracking-tight leading-tight max-w-[360px]">
            Ministry of Civil Aviation <br /> & Airport's Development
          </h1>
          <p className="text-[10px] text-blue-600 mt-2 uppercase tracking-[0.2em] font-black">
            Republic of Somaliland
          </p>
          <div className="h-1 w-16 bg-blue-600 rounded-full mt-8 mb-4"></div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Sign In</h3>
          <p className="text-slate-500 mt-1 text-sm font-medium">Access the license management system.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl animate-in fade-in slide-in-from-top-1 duration-300 font-medium text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
                placeholder="name@agency.gov"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <a href="#" className="text-xs font-bold text-blue-600 hover:underline">Forgot?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign In to System</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          © 2026 MOCAAD Somaliland
        </div>
      </div>
    </div>
  );
}
