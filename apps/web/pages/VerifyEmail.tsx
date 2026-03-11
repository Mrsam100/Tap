import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('No verification token provided.'); return; }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        if (res.ok) { setStatus('success'); }
        else { const data = await res.json(); setStatus('error'); setErrorMsg(data.error || 'Verification failed'); }
      })
      .catch(() => { setStatus('error'); setErrorMsg('Something went wrong'); });
  }, [token]);

  return (
    <div className="min-h-screen pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 flex items-center justify-center bg-dot-pattern dark:bg-none dark:bg-black">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-tap-m text-center animate-fade-up">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-ink dark:border-t-white rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-serif text-ink dark:text-white">Verifying your email...</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-3xl font-serif text-ink dark:text-white mb-2">Email verified!</h1>
            <p className="text-slate-500 dark:text-slate-400 font-light mb-6">Your account is now fully set up.</p>
            <Link to="/dashboard"><Button fullWidth>Go to Dashboard</Button></Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-jam-red rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} />
            </div>
            <h1 className="text-3xl font-serif text-ink dark:text-white mb-2">Verification failed</h1>
            <p className="text-slate-500 dark:text-slate-400 font-light mb-6">{errorMsg}</p>
            <Link to="/login"><Button variant="secondary" fullWidth>Back to login</Button></Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
