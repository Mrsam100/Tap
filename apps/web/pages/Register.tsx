import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Github, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import PasswordInput from '../components/ui/PasswordInput';
import PasswordStrengthMeter from '../components/ui/PasswordStrengthMeter';
import { useAuthStore } from '../src/stores/authStore';
import { friendlyError } from '../src/lib/errorMessages';

interface FieldErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const register = useAuthStore(s => s.register);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Username availability check
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        if (!res.ok) { setUsernameAvailable(null); return; }
        const data = await res.json();
        setUsernameAvailable(data.available);
        if (!data.available) {
          setFieldErrors(prev => ({ ...prev, username: 'Username is already taken' }));
        } else {
          setFieldErrors(prev => ({ ...prev, username: undefined }));
        }
      } catch {
        setUsernameAvailable(null); // couldn't check — will validate on submit
        setFieldErrors(prev => ({ ...prev, username: undefined }));
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
    return () => { if (usernameTimer.current) clearTimeout(usernameTimer.current); };
  }, [username]);

  const validateField = (field: string, value: string) => {
    const errors: FieldErrors = { ...fieldErrors };

    switch (field) {
      case 'email':
        if (!value) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Enter a valid email address';
        else delete errors.email;
        break;
      case 'username':
        if (!value) errors.username = 'Username is required';
        else if (value.length < 3) errors.username = 'Must be at least 3 characters';
        else if (value.length > 30) errors.username = 'Must be 30 characters or less';
        else if (usernameAvailable === false) errors.username = 'Username is already taken';
        else delete errors.username;
        break;
      case 'password':
        if (!value) errors.password = 'Password is required';
        else if (value.length < 8) errors.password = 'Must be at least 8 characters';
        else delete errors.password;
        // Re-validate confirm if already touched
        if (touched.confirmPassword && confirmPassword && value !== confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        } else if (touched.confirmPassword && confirmPassword) {
          delete errors.confirmPassword;
        }
        break;
      case 'confirmPassword':
        if (!value) errors.confirmPassword = 'Please confirm your password';
        else if (value !== password) errors.confirmPassword = 'Passwords do not match';
        else delete errors.confirmPassword;
        break;
    }

    setFieldErrors(errors);
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched
    setTouched({ email: true, username: true, password: true, confirmPassword: true });

    // Validate all
    const errors: FieldErrors = {};
    if (!email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
    if (!username) errors.username = 'Username is required';
    else if (username.length < 3) errors.username = 'Must be at least 3 characters';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Must be at least 8 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, username, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(friendlyError(err instanceof Error ? err.message : 'Registration failed'));
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: keyof FieldErrors) => {
    const hasError = touched[field] && fieldErrors[field];
    const isValid = touched[field] && !fieldErrors[field] && (field === 'email' ? email : field === 'username' ? username : field === 'password' ? password : confirmPassword);
    return `w-full px-4 py-2.5 rounded-lg border transition-all bg-slate-50 dark:bg-slate-800 text-ink dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 ${
      hasError
        ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
        : isValid
          ? 'border-emerald-400 dark:border-emerald-500 focus:ring-emerald-400'
          : 'border-slate-200 dark:border-slate-700 focus:border-ink dark:focus:border-white focus:ring-ink dark:focus:ring-white'
    }`;
  };

  const FieldMessage: React.FC<{ field: keyof FieldErrors }> = ({ field }) => {
    if (!touched[field]) return null;
    if (fieldErrors[field]) {
      return <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors[field]}</p>;
    }
    return null;
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 flex items-center justify-center bg-dot-pattern dark:bg-none dark:bg-black">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-tap-m animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-ink dark:text-white mb-2">Create your Tap</h1>
          <p className="text-slate-500 dark:text-slate-400 font-light">One link to share everything.</p>
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
              onBlur={() => handleBlur('email', email)}
              placeholder="you@example.com"
              className={inputClass('email')}
            />
            <FieldMessage field="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink dark:text-slate-200 mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">tap.bio/</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                onBlur={() => handleBlur('username', username)}
                placeholder="yourname"
                maxLength={30}
                className={`${inputClass('username')} pl-[4.5rem]`}
              />
              {username.length >= 3 && !checkingUsername && usernameAvailable === true && (
                <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              )}
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              )}
            </div>
            <div className="flex justify-between items-center">
              <FieldMessage field="username" />
              <span className="text-[10px] text-slate-400 mt-1">{username.length}/30</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink dark:text-slate-200 mb-1.5">Password</label>
            <PasswordInput
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => handleBlur('password', password)}
              placeholder="Min 8 characters"
              className={inputClass('password')}
            />
            <PasswordStrengthMeter password={password} />
            <FieldMessage field="password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink dark:text-slate-200 mb-1.5">Confirm Password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur('confirmPassword', confirmPassword)}
              placeholder="Re-enter password"
              className={inputClass('confirmPassword')}
            />
            <FieldMessage field="confirmPassword" />
          </div>

          <Button fullWidth type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-ink dark:text-white hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
