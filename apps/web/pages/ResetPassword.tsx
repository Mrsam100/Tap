import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import PasswordInput from '../components/ui/PasswordInput';
import PasswordStrengthMeter from '../components/ui/PasswordStrengthMeter';
import { friendlyError } from '../src/lib/errorMessages';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:border-ink dark:focus:border-white focus:ring-ink dark:focus:ring-white transition-all";

  if (!token) {
    return (
      <div className="min-h-screen pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 flex items-center justify-center bg-dot-pattern dark:bg-none dark:bg-black">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-tap-m text-center">
          <h1 className="text-3xl font-serif text-ink dark:text-white mb-2">Invalid Link</h1>
          <p className="text-slate-500 dark:text-slate-400 font-light mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password"><Button variant="secondary" fullWidth>Request a new link</Button></Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      setError(friendlyError(err instanceof Error ? err.message : 'Reset failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 flex items-center justify-center bg-dot-pattern dark:bg-none dark:bg-black">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-tap-m text-center animate-scale-in">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-3xl font-serif text-ink dark:text-white mb-2">Password reset!</h1>
          <p className="text-slate-500 dark:text-slate-400 font-light">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 flex items-center justify-center bg-dot-pattern dark:bg-none dark:bg-black">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-tap-m animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-ink dark:text-white mb-2">Set new password</h1>
          <p className="text-slate-500 dark:text-slate-400 font-light">Enter your new password below.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-jam-red dark:text-red-400 text-sm rounded-lg animate-fade-up">
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-ink dark:text-slate-200 mb-1.5">New Password</label>
            <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" className={inputClass} />
            <PasswordStrengthMeter password={password} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink dark:text-slate-200 mb-1.5">Confirm Password</label>
            <PasswordInput value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className={inputClass} />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />Passwords do not match</p>
            )}
          </div>
          <Button fullWidth type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
