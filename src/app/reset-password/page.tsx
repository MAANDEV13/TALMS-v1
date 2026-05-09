'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<'loading' | 'valid' | 'expired' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setState('expired');
      return;
    }

    async function validate() {
      try {
        const res = await fetch(`/api/password-reset?token=${token}`);
        const data = await res.json();
        if (data.valid) {
          setEmail(data.email);
          setState('valid');
        } else {
          setState('expired');
        }
      } catch {
        setState('expired');
      }
    }

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setState('success');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        if (res.status === 404) {
          setState('expired');
        } else {
          setErrorMsg(data.error || 'Something went wrong. Please try again.');
        }
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 p-8 lg:p-12">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4 drop-shadow-lg">
            <img src="/logo.png" alt="MOCAAD Logo" className="w-56 h-auto object-contain" />
          </div>
          <h1 className="text-xl font-[900] text-slate-950 uppercase tracking-tight leading-tight max-w-[360px]">
            Ministry of Civil Aviation <br /> & Airport&apos;s Development
          </h1>
          <p className="text-[10px] text-blue-600 mt-2 uppercase tracking-[0.2em] font-black">
            Republic of Somaliland
          </p>
        </div>

        {/* Loading State */}
        {state === 'loading' && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Validating reset link...</p>
          </div>
        )}

        {/* Expired State */}
        {state === 'expired' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Link Expired</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              This password reset link has expired or is invalid.<br />
              Please contact your administrator to send a new link.
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
            >
              Go to Login
            </a>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Password Updated!</h3>
            <p className="text-slate-500 text-sm mb-2">
              Your password has been reset successfully. Redirecting to login...
            </p>
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto mt-4" />
          </div>
        )}

        {/* Password Reset Form */}
        {state === 'valid' && (
          <>
            <div className="h-1 w-16 bg-red-500 rounded-full mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-900 tracking-tight text-center">Reset Password</h3>
            <p className="text-slate-500 mt-1 text-sm font-medium text-center mb-8">
              Enter your new password below.
            </p>

            {/* Email display */}
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Account</p>
              <p className="text-sm font-bold text-slate-800">{email}</p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl font-medium text-center flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
                    placeholder="New password (min 6 chars)"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Confirm New Password</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Update Password</span>
                    <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="mt-10 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          © 2026 MOCAAD Somaliland
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
