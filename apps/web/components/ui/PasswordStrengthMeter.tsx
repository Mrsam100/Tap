import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (pw: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'Contains uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Contains lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Contains a number', test: (pw) => /\d/.test(pw) },
];

function getStrength(password: string): { score: number; label: string; color: string; bg: string } {
  if (!password) return { score: 0, label: '', color: '', bg: '' };
  const passed = REQUIREMENTS.filter((r) => r.test(password)).length;
  if (passed <= 1) return { score: 1, label: 'Weak', color: 'text-red-500', bg: 'bg-red-500' };
  if (passed <= 2) return { score: 2, label: 'Fair', color: 'text-amber-500', bg: 'bg-amber-500' };
  if (passed <= 3) return { score: 3, label: 'Good', color: 'text-blue-500', bg: 'bg-blue-500' };
  return { score: 4, label: 'Strong', color: 'text-emerald-500', bg: 'bg-emerald-500' };
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 animate-fade-up">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                level <= strength.score ? strength.bg : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1">
        {REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <li key={req.label} className="flex items-center gap-1.5 text-xs">
              {met ? (
                <Check size={12} className="text-emerald-500 flex-shrink-0" />
              ) : (
                <X size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
              )}
              <span className={met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}>
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
