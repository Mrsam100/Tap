import React from 'react';
import { motion } from 'motion/react';
import { Check, Copy } from 'lucide-react';

const PhoneSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-slate-100/50 dark:border-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 sm:gap-16 lg:gap-20">
          
          {/* Phone Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative mx-auto lg:mx-0 shrink-0"
          >
            <div className="w-[320px] bg-white rounded-[40px] border-8 border-slate-900 shadow-2xl relative overflow-hidden z-10 aspect-[9/19] dark:border-slate-800">
                {/* Screen Content */}
                <div className="w-full h-full bg-cream flex flex-col font-sans overflow-y-auto no-scrollbar dark:bg-slate-900">
                    {/* Minimal Header */}
                    <div className="pt-12 pb-6 px-6 text-center border-b border-slate-100 dark:border-slate-800">
                        <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4 font-serif italic text-ink dark:bg-slate-800 dark:text-white">
                            S.
                        </div>
                        <h2 className="text-lg font-bold text-ink mb-1 font-serif dark:text-white">Studio Selene</h2>
                        <p className="text-xs text-slate-500">Dubai, UAE</p>
                    </div>

                    {/* Simple Links */}
                    <div className="p-4 space-y-3">
                        {['Book Consultation', 'View Portfolio', 'Commercial Projects', 'Contact'].map((link, i) => (
                            <div key={i} className="w-full py-4 px-6 bg-white border border-slate-200 rounded-xl text-sm font-medium text-ink flex items-center justify-between shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                {link}
                                <span className="text-slate-300">→</span>
                            </div>
                        ))}
                    </div>

                    {/* Socials */}
                    <div className="mt-auto pb-8 pt-4 flex justify-center gap-4 text-slate-400">
                        <div className="w-8 h-8 bg-slate-100 rounded-full dark:bg-slate-800"></div>
                        <div className="w-8 h-8 bg-slate-100 rounded-full dark:bg-slate-800"></div>
                        <div className="w-8 h-8 bg-slate-100 rounded-full dark:bg-slate-800"></div>
                    </div>
                </div>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 max-w-lg text-center lg:text-left"
          >
             <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-ink mb-4 sm:mb-6 dark:text-white">
                Spread like <span className="text-jam-red">Jam.</span>
             </h2>
             <p className="text-lg text-slate-500 mb-10 leading-relaxed font-light dark:text-slate-400">
                Create a stunning, minimalist page for your business in seconds. 
                Focus on what you build, not how you build your website.
             </p>
             
             <div className="space-y-6">
                {[
                    { title: "Zero Configuration", desc: "No DNS, no hosting, no headaches." },
                    { title: "Instant Aesthetics", desc: "Clean, editorial design by default." },
                    { title: "Built for Conversion", desc: "Optimized paths for your customers." }
                ].map((item, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="flex gap-4 items-start text-left"
                    >
                        <div className="mt-1 w-5 h-5 rounded-full border border-jam-red/30 bg-jam-red/5 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-jam-red"></div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-ink font-serif dark:text-white">{item.title}</h3>
                            <p className="text-slate-500 font-light dark:text-slate-400">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
             </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default PhoneSection;