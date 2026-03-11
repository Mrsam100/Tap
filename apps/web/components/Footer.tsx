import React from 'react';
import { Twitter, Instagram, Linkedin, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="pt-16 sm:pt-24 pb-10 sm:pb-12 px-4 sm:px-6 bg-white dark:bg-black border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-12 gap-8 sm:gap-12 mb-12 sm:mb-20">
                {/* Brand Column */}
                <div className="col-span-2 md:col-span-4">
                    <Link to="/" className="flex items-center gap-3 mb-6 group">
                        <div className="relative w-8 h-8">
                             <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-jam-red transition-transform duration-500 group-hover:rotate-6">
                                <rect x="11" y="8" width="10" height="22" rx="5" stroke="currentColor" strokeWidth="2.5" className="fill-white dark:fill-black" />
                                <rect x="2" y="2" width="28" height="10" rx="5" stroke="currentColor" strokeWidth="2.5" className="fill-white dark:fill-black" />
                             </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-ink dark:text-white font-serif">Tap.</span>
                    </Link>
                    <p className="text-slate-500 dark:text-slate-400 font-light mb-8 max-w-sm">
                        The simplest way to build a beautiful online presence.
                        No code, no drag-and-drop, just pure content.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-ink dark:hover:text-white transition-colors"><Twitter size={18} /></a>
                        <a href="#" className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-ink dark:hover:text-white transition-colors"><Instagram size={18} /></a>
                        <a href="#" className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-ink dark:hover:text-white transition-colors"><Linkedin size={18} /></a>
                        <a href="#" className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-ink dark:hover:text-white transition-colors"><Github size={18} /></a>
                    </div>
                </div>

                {/* Links Columns */}
                <div className="md:col-span-2">
                    <h4 className="font-bold text-ink dark:text-white mb-6">Product</h4>
                    <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                        <li><Link to="/features" className="hover:text-ink dark:hover:text-white transition-colors">Features</Link></li>
                        <li><Link to="/pricing" className="hover:text-ink dark:hover:text-white transition-colors">Pricing</Link></li>
                        <li><Link to="/build" className="hover:text-ink dark:hover:text-white transition-colors">Showcase</Link></li>
                        <li><Link to="/login" className="hover:text-ink dark:hover:text-white transition-colors">Login</Link></li>
                    </ul>
                </div>

                <div className="md:col-span-2">
                    <h4 className="font-bold text-ink dark:text-white mb-6">Resources</h4>
                    <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                        <li><Link to="/blog" className="hover:text-ink dark:hover:text-white transition-colors">Blog</Link></li>
                        <li><Link to="/blog" className="hover:text-ink dark:hover:text-white transition-colors">Community</Link></li>
                        <li><Link to="/help" className="hover:text-ink dark:hover:text-white transition-colors">Help Center</Link></li>
                        <li><Link to="/api" className="hover:text-ink dark:hover:text-white transition-colors">Developers</Link></li>
                    </ul>
                </div>

                <div className="md:col-span-2">
                    <h4 className="font-bold text-ink dark:text-white mb-6">Company</h4>
                    <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                        <li><Link to="/about" className="hover:text-ink dark:hover:text-white transition-colors">About</Link></li>
                        <li><Link to="/careers" className="hover:text-ink dark:hover:text-white transition-colors">Careers</Link></li>
                        <li><Link to="/privacy" className="hover:text-ink dark:hover:text-white transition-colors">Legal</Link></li>
                        <li><Link to="/contact" className="hover:text-ink dark:hover:text-white transition-colors">Contact</Link></li>
                    </ul>
                </div>

                <div className="col-span-2 md:col-span-2">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 sm:p-6 text-center border border-slate-100 dark:border-slate-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-3 animate-pulse"></div>
                        <div className="text-xs font-bold text-ink dark:text-white mb-1">Systems Normal</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">99.99% Uptime</div>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-sm text-slate-400 dark:text-slate-500">
                    &copy; {new Date().getFullYear()} Tap Inc. All rights reserved.
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                    <Link to="/privacy" className="hover:text-ink dark:hover:text-white transition-colors">Privacy Policy</Link>
                    <Link to="/terms" className="hover:text-ink dark:hover:text-white transition-colors">Terms of Service</Link>
                    <Link to="/cookies" className="hover:text-ink dark:hover:text-white transition-colors">Cookies</Link>
                </div>
            </div>
        </div>
    </footer>
  );
};

export default Footer;
