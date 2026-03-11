import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Sun, Moon, Search, LogOut, User, Users, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import { useAuthStore } from '../src/stores/authStore';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  // IMP1: close menus on route change
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Sync dark mode across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        setIsDark(e.newValue === 'dark');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => setIsDark(!isDark);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/blog?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleNavClick = (hash: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
        navigate('/' + hash);
    } else {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
  };

  const handleJoinBeta = () => {
      navigate(isAuthenticated ? '/dashboard' : '/register');
      setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out px-4 md:px-6 pt-4`}>
      <div className={`mx-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
        scrolled
          ? 'max-w-5xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 shadow-tap-m rounded-full py-2.5 px-6'
          : 'max-w-7xl bg-transparent py-4 px-0'
      }`}>
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <div className="relative w-8 h-8">
             <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-jam-red transition-transform duration-500 group-hover:rotate-6">
                {/* Vertical Stem */}
                <rect x="11" y="8" width="10" height="22" rx="5" stroke="currentColor" strokeWidth="2.5" className="fill-cream" />
                {/* Horizontal Top */}
                <rect x="2" y="2" width="28" height="10" rx="5" stroke="currentColor" strokeWidth="2.5" className="fill-cream" />
             </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-ink dark:text-white font-serif">Tap.</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          <div className={`flex items-center gap-1 mr-4 px-2 py-1 rounded-full transition-all ${scrolled ? 'bg-slate-100/50 border border-white/20' : ''}`}>
              <Link to="/features" className={`px-4 py-1.5 text-sm font-medium transition-colors rounded-full ${location.pathname === '/features' ? 'text-ink dark:text-white bg-white/60 dark:bg-white/15' : 'text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'}`}>Features</Link>
              <Link to="/pricing" className={`px-4 py-1.5 text-sm font-medium transition-colors rounded-full ${location.pathname === '/pricing' ? 'text-ink dark:text-white bg-white/60 dark:bg-white/15' : 'text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'}`}>Pricing</Link>
              <button onClick={() => handleNavClick('#analytics')} className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white transition-colors rounded-full hover:bg-white/50 dark:hover:bg-white/10">Analytics</button>
              <button onClick={() => handleNavClick('#monetization')} className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white transition-colors rounded-full hover:bg-white/50 dark:hover:bg-white/10">Monetization</button>
              <Link to="/blog" className={`px-4 py-1.5 text-sm font-medium transition-colors rounded-full ${location.pathname.startsWith('/blog') ? 'text-ink dark:text-white bg-white/60 dark:bg-white/15' : 'text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'}`}>Blog</Link>
          </div>
          
          {/* Search Bar */}
          <div className="relative mr-2" ref={searchRef}>
            {searchOpen ? (
              <form onSubmit={handleSearch} className="animate-scale-in">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 px-4 py-1.5 text-sm rounded-full border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-ink dark:text-white backdrop-blur-sm focus:outline-none focus:border-jam-red transition-all"
                />
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-2 mr-2 text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                <div className="w-7 h-7 rounded-full bg-jam-red text-white flex items-center justify-center text-xs font-bold">
                  {user.displayName?.[0]?.toUpperCase() || user.username[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-sm font-medium text-ink dark:text-white max-w-[100px] truncate" title={user.displayName || user.username}>{user.displayName || user.username}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-tap-m py-1.5 animate-scale-in origin-top-right">
                  <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <User size={15} /> Dashboard
                  </Link>
                  <Link to="/dashboard/audience" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Users size={15} /> Audience
                  </Link>
                  <div className="h-px bg-slate-100 my-1" />
                  <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-jam-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white transition-colors font-sans mr-4">Login</Link>
              <Button variant="primary" size="sm" onClick={handleJoinBeta} className={scrolled ? 'shadow-none' : ''}>
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleDarkMode}
            className="p-2 text-ink dark:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className="text-ink dark:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`absolute top-16 sm:top-20 left-3 right-3 sm:left-4 sm:right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl md:hidden flex flex-col gap-1 max-h-[80vh] overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top ${
        mobileMenuOpen 
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'
      }`}>
         <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="text-left text-lg font-medium text-ink dark:text-white py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Features</Link>
         <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-left text-lg font-medium text-ink dark:text-white py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Pricing</Link>
         <button onClick={() => handleNavClick('#analytics')} className="text-left text-lg font-medium text-ink dark:text-white py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full">Analytics</button>
         <button onClick={() => handleNavClick('#monetization')} className="text-left text-lg font-medium text-ink dark:text-white py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full">Monetization</button>
         <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="text-left text-lg font-medium text-ink dark:text-white py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Blog</Link>
         <div className="h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
         {isAuthenticated && user ? (
           <>
             <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-ink dark:text-white py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Dashboard</Link>
             <Link to="/dashboard/audience" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-ink dark:text-white py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Audience</Link>
             <button onClick={handleLogout} className="text-left text-lg font-medium text-jam-red py-3 px-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Sign out</button>
           </>
         ) : (
           <>
             <Link to="/login" className="text-lg font-medium text-ink dark:text-white py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setMobileMenuOpen(false)}>Login</Link>
             <div className="pt-2">
               <Button fullWidth variant="primary" onClick={handleJoinBeta}>
                 Get Started
               </Button>
             </div>
           </>
         )}
      </div>
    </nav>
  );
};

export default Navbar;