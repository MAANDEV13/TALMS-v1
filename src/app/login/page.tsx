'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Lock, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  XCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'login' | 'otp' | 'forgot'>('login');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(email, password);
    
    if (result.success && result.requiresOtp) {
      setStep('otp');
      setLoading(false);
    } else if (!result.success) {
      setError(result.error || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await verifyOtp(email, otp);
    
    if (!result.success) {
      setError(result.error || 'Invalid OTP code.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        setForgotSent(true);
      } else {
        setForgotError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 p-8 lg:p-12">
        
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="mb-4 drop-shadow-lg">
            <img src="/logo.png" alt="MOCAAD Logo" className="w-56 h-auto object-contain" />
          </div>
          <h1 className="text-xl font-[900] text-slate-950 uppercase tracking-tight leading-tight max-w-[360px]">
            Ministry of Civil Aviation <br /> &amp; Airport&apos;s Development
          </h1>
          <p className="text-[10px] text-blue-600 mt-2 uppercase tracking-[0.2em] font-black">
            Republic of Somaliland
          </p>
          <div className="h-1 w-16 bg-blue-600 rounded-full mt-8 mb-4"></div>
          {step === 'forgot' ? (
            <>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Forgot Password</h3>
              <p className="text-slate-500 mt-1 text-sm font-medium">Enter your email to receive a reset link.</p>
            </>
          ) : (
            <>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Sign In</h3>
              <p className="text-slate-500 mt-1 text-sm font-medium">Access the license management system.</p>
            </>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl animate-in fade-in slide-in-from-top-1 duration-300 font-medium text-center">
            {error}
          </div>
        )}

        {step === 'login' ? (
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
                <button 
                  type="button"
                  onClick={() => { setStep('forgot'); setForgotEmail(email); setForgotSent(false); setForgotError(null); }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Forgot?
                </button>
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
        ) : step === 'otp' ? (
          <form className="space-y-6" onSubmit={handleVerifyOtp}>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-center mb-6">
              <p className="text-sm font-medium text-blue-800">
                We&apos;ve sent a 6-digit verification code to <strong>{email}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Security Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 text-center font-mono text-2xl tracking-widest"
                  placeholder="000000"
                  required
                  maxLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Verify &amp; Login</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setStep('login'); setOtp(''); setPassword(''); }}
              className="w-full py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
            >
              Back to Login
            </button>
          </form>
        ) : (
          /* Forgot Password Step */
          <div className="space-y-6">
            {forgotSent ? (
              <div className="text-center space-y-4 py-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Reset Link Sent</h4>
                <p className="text-sm text-slate-500 leading-relaxed px-4">
                  If an account with <strong className="text-slate-700">{forgotEmail}</strong> exists, 
                  we&apos;ve sent a password reset link. Please check your email.
                </p>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-xs font-bold text-amber-800">⏱ The reset link expires in 5 minutes.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep('login'); setForgotSent(false); }}
                  className="w-full py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleForgotPassword}>
                {forgotError && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl font-medium text-center flex items-center justify-center gap-2 animate-in fade-in duration-200">
                    <XCircle className="w-4 h-4 shrink-0" />
                    {forgotError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Your Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
                      placeholder="name@agency.gov"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-400 ml-1">
                    Enter the email associated with your TALMS account.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('login'); setForgotError(null); }}
                  className="w-full py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          © 2026 MOCAAD Somaliland
        </div>
      </div>
    </div>
  );
}
