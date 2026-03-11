import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return; }
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:border-ink dark:focus:border-white focus:ring-ink dark:focus:ring-white transition-all";

  if (success) {
    return (
      <div className="min-h-screen pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 flex items-center justify-center bg-dot-pattern dark:bg-none dark:bg-black">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-tap-m text-center animate-scale-in">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-3xl font-serif text-ink dark:text-white mb-2">Check your email</h1>
          <p className="text-slate-500 dark:text-slate-400 font-light mb-8">
            If an account exists with <span className="font-medium text-ink dark:text-white">{email}</span>, we've sent a password reset link.
          </p>
          <Link to="/login">
            <Button variant="secondary" fullWidth>Back to login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 flex items-center justify-center bg-dot-pattern dark:bg-none dark:bg-black">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-tap-m animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-ink dark:text-white mb-2">Reset password</h1>
          <p className="text-slate-500 dark:text-slate-400 font-light">Enter your email and we'll send you a reset link.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-jam-red dark:text-red-400 text-sm rounded-lg animate-fade-up">
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}

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
          <Button fullWidth type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          <Link to="/login" className="text-ink dark:text-white hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
