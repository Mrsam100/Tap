import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Github } from 'lucide-react';
import Button from '../components/ui/Button';
import PasswordInput from '../components/ui/PasswordInput';
import { useAuthStore } from '../src/stores/authStore';
import { friendlyError } from '../src/lib/errorMessages';

const safeReturnUrl = (url: string | null): string => {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return '/dashboard';
  return url;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore(s => s.login);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const returnUrl = safeReturnUrl(searchParams.get('returnUrl'));

  useEffect(() => {
    if (isAuthenticated) navigate(returnUrl, { replace: true });
  }, [isAuthenticated, navigate, returnUrl]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState(
    searchParams.get('error') === 'oauth_failed'
      ? 'OAuth login failed. Please try again.'
      : searchParams.get('expired') === 'true'
        ? 'Your session expired. Please sign in again.'
        : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password are required'); return; }
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password, mfaRequired ? mfaCode : undefined);
      if (result.mfaRequired) {
        setMfaRequired(true);
        setIsSubmitting(false);
        return;
      }
      navigate(returnUrl);
    } catch (err: unknown) {
      setError(friendlyError(err instanceof Error ? err.message : 'Login failed'));
      setMfaCode('');
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:border-ink dark:focus:border-white focus:ring-ink dark:focus:ring-white transition-all";

  return (
    <div className="min-h-screen pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 flex items-center justify-center bg-dot-pattern dark:bg-none dark:bg-black">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-tap-m animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-ink dark:text-white mb-2">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 font-light">Sign in to your Tap account.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-jam-red dark:text-red-400 text-sm rounded-lg animate-fade-up">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <a href="/api/auth/google" className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-ink dark:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </a>
          <a href="/api/auth/github" className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-ink dark:text-white">
            <Github size={18} />
            Continue with GitHub
          </a>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
          <div className="relative flex justify-center text-xs"><span className="px-3 bg-white dark:bg-slate-900 text-slate-400">or</span></div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-ink dark:text-slate-200 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium text-ink dark:text-slate-200">Password</label>
              <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-ink dark:hover:text-white transition-colors">Forgot password?</Link>
            </div>
            <PasswordInput
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {mfaRequired && (
            <div className="animate-fade-up">
              <label className="block text-sm font-medium text-ink dark:text-slate-200 mb-1.5">Authentication Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className={`${inputClass} text-center text-lg tracking-widest`}
              />
              <p className="text-xs text-slate-400 mt-1">Enter the 6-digit code from your authenticator app.</p>
            </div>
          )}

          <Button fullWidth type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-ink dark:text-white hover:underline">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
