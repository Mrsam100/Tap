import React from 'react';
import Button from './ui/Button';
import { Check, Sparkles, Zap, Globe } from 'lucide-react';

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-20 sm:py-32 px-4 sm:px-6 bg-slate-50/50 dark:bg-black relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-gradient-to-b from-jam-red/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-20">
                <h2 className="text-3xl sm:text-5xl md:text-7xl font-serif text-ink dark:text-white mb-6 tracking-tight animate-fade-up">
                    Start for <span className="text-jam-red italic">free</span>.
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-base sm:text-xl font-light max-w-2xl mx-auto animate-fade-up [animation-delay:200ms]">
                    We believe everyone deserves a beautiful corner of the internet. 
                    No hidden fees. No trial periods. Just you and your audience. 
                    Scale as you grow with our professional features.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
                {/* Free Tier */}
                <div className="relative p-6 sm:p-10 rounded-3xl sm:rounded-[40px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col hover:-translate-y-2 transition-all duration-500 group overflow-hidden animate-fade-up [animation-delay:400ms]">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity animate-float">
                         <Sparkles size={120} className="text-jam-red rotate-12" />
                    </div>

                    <div className="mb-8">
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
                            The Standard
                         </div>
                         <h3 className="text-5xl font-serif text-ink dark:text-white mb-2">Free</h3>
                         <p className="text-slate-500 dark:text-slate-400">Forever.</p>
                    </div>
                    
                    <div className="space-y-5 mb-10 flex-1 relative z-10">
                        {[
                            "Unlimited Links",
                            "Custom Profile Picture",
                            "Social Media Icons",
                            "Basic Analytics",
                            "Standard Themes",
                            "QR Code Generation",
                            "Tip Jar Integration",
                            "SEO Optimization",
                            "Mobile App Access"
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-4 text-base text-ink dark:text-white font-medium">
                                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 text-green-600 dark:text-green-400">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                {feat}
                            </div>
                        ))}
                    </div>
                    
                    <Button variant="primary" fullWidth size="lg" className="shadow-xl shadow-jam-red/20">
                        Claim your link
                    </Button>
                </div>

                {/* Contact/Enterprise Tier */}
                <div className="relative p-6 sm:p-10 rounded-3xl sm:rounded-[40px] border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl flex flex-col hover:-translate-y-2 transition-all duration-500 animate-fade-up [animation-delay:600ms]">
                     <div className="mb-8">
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-jam-red/10 text-xs font-bold uppercase tracking-widest text-jam-red mb-4">
                            For Teams
                         </div>
                         <h3 className="text-4xl font-serif text-ink dark:text-white mb-2">Enterprise</h3>
                         <p className="text-slate-500 dark:text-slate-400">Custom solutions.</p>
                    </div>

                    <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed font-light">
                        Need more? We offer white-glove service for agencies, brands, and large teams. 
                        Get custom domains, advanced SSO, and dedicated support. 
                        Perfect for managing multiple profiles and high-traffic sites.
                    </p>
                    
                    <div className="space-y-5 mb-10 flex-1">
                         {[
                            "Custom Domain (yourname.com)",
                            "Remove Tap Branding",
                            "Team Collaboration",
                            "Advanced Pixel Tracking",
                            "Priority API Access",
                            "Dedicated Account Manager",
                            "SLA Guarantees"
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-4 text-base text-slate-600 dark:text-slate-400">
                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
                                    <Globe size={14} strokeWidth={3} />
                                </div>
                                {feat}
                            </div>
                        ))}
                    </div>
                    
                    <Button variant="outline" fullWidth size="lg">
                        Contact Sales
                    </Button>
                </div>
            </div>
        </div>
    </section>
  );
};

export default Pricing;