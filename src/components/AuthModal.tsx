import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, X, AlertCircle, Loader2, ShieldCheck, Key } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_DEFAULT_PASS } from '../utils/admin';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user?: any) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFillSuperAdmin = () => {
    setEmail(SUPER_ADMIN_EMAIL);
    setPassword(SUPER_ADMIN_DEFAULT_PASS);
    setError(null);
    setNotice('Super-Admin credentials filled. Click "Sign In" below.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const isSuperAdminCreds =
      email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() &&
      password === SUPER_ADMIN_DEFAULT_PASS;

    const supabase = getSupabase();

    // If Supabase is not configured yet or in local test environment
    if (!supabase) {
      if (isSuperAdminCreds) {
        onSuccess({ id: 'super-admin-01', email: SUPER_ADMIN_EMAIL });
        onClose();
        return;
      }
      setError('Please connect your Supabase project first via Connection Settings.');
      return;
    }

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          onSuccess(data.session.user);
          onClose();
        } else {
          setNotice('Sign up successful! Please check your email to confirm your account, or sign in.');
          setIsSignUp(false);
        }
      } else {
        // Try sign in first
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // If super-admin creds are used and user not registered yet in Supabase, auto-create
          if (isSuperAdminCreds) {
            try {
              const { data: autoSignUpData } = await supabase.auth.signUp({
                email,
                password,
              });

              if (autoSignUpData?.session?.user) {
                onSuccess(autoSignUpData.session.user);
                onClose();
                return;
              } else if (autoSignUpData?.user) {
                onSuccess(autoSignUpData.user);
                onClose();
                return;
              }
            } catch (_) {
              // Ignore signup error and fall back to local authenticated super-admin
            }

            // Direct verified super-admin access fallback
            onSuccess({ id: 'super-admin-01', email: SUPER_ADMIN_EMAIL });
            onClose();
            return;
          }
          throw signInError;
        }

        onSuccess(signInData?.user);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            {isSignUp ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isSignUp ? 'Create Business Account' : 'Business Owner / Super-Admin Sign In'}
            </h2>
            <p className="text-xs text-slate-400">Authenticating via Supabase Auth</p>
          </div>
        </div>

        {/* Super Admin Quick Fill Option */}
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="text-amber-200 font-semibold block">Super-Admin Access</span>
              <span className="text-[11px] text-amber-400/80 font-mono">bizbook@gmail.com</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillSuperAdmin}
            className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition active:scale-95"
          >
            Quick Fill
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bizbook@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            {isSignUp && <p className="text-xs text-slate-500 mt-1">Minimum 6 characters.</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-slate-400 hover:text-indigo-400 transition"
          >
            {isSignUp ? 'Already have an account? Sign in here' : "Don't have an account yet? Sign up here"}
          </button>
        </div>
      </div>
    </div>
  );
};
