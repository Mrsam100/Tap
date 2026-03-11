import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-sans tracking-tight relative overflow-hidden";
  
  const variants = {
    primary: "bg-ink hover:bg-slate-800 text-white shadow-lg shadow-ink/20 border border-white/10 hover:shadow-xl hover:-translate-y-0.5",
    secondary: "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-ink dark:text-white border border-white/50 dark:border-slate-700/50 shadow-sm hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:border-white/80 dark:hover:border-slate-600",
    outline: "bg-transparent border border-slate-300 dark:border-slate-600 text-ink dark:text-white hover:border-ink dark:hover:border-white hover:bg-slate-50/50 dark:hover:bg-slate-800/50 backdrop-blur-sm",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:text-ink dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
  };

  const sizes = {
    sm: "text-xs px-4 py-2 gap-1.5",
    md: "text-sm px-6 py-2.5 gap-2",
    lg: "text-base px-8 py-3.5 gap-2.5"
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      {...props}
    >
      {/* Glossy reflection effect overlay */}
      {variant === 'primary' && (
        <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10"></div>
      )}
      {children}
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={2} />}
    </button>
  );
};

export default Button;