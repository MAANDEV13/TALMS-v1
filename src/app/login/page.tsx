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
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        
        {/* Left Side: Illustration & Branding */}
        <div className="bg-slate-900 p-12 text-white hidden lg:flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/40 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left gap-6 mb-12">
              <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/10 shadow-2xl">
                <img src="/logo.png" alt="MOCAAD Logo" className="w-32 h-32 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white leading-tight uppercase">
                  Ministry of Civil Aviation <br /> & Airport's Development
                </h1>
                <p className="text-sm text-blue-400 mt-2 uppercase tracking-[0.3em] font-black opacity-80">
                  Republic of Somaliland
                </p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold leading-tight mb-6 text-white">
              Travel Agency <br />
              <span className="text-blue-400">Operating Portal.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
              Official system for licensing, oversight, and aviation compliance management.
            </p>
          </div>

          <div className="relative z-10 space-y-6 text-white">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="font-bold">Secure Access</p>
                <p className="text-sm text-slate-400">Role-based security for all users.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="font-bold">Agency Network</p>
                <p className="text-sm text-slate-400">Unified management across all branches.</p>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 pt-12 text-xs text-slate-500 font-bold uppercase tracking-widest">
            © 2026 MOCAAD Somaliland.
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-bold text-slate-900">Sign In</h3>
            <p className="text-slate-500 mt-2 text-lg">Access the license management system.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl animate-in fade-in slide-in-from-top-1 duration-300 font-medium">
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
                <a href="#" className="text-xs font-bold text-blue-600 hover:underline">Forgot password?</a>
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

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Demo Admin: <b>admin@agency.gov</b> / <b>admin123</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
