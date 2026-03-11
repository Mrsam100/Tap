import React from 'react';
import { motion } from 'motion/react';
import { Scissors, Laptop, Rocket, Coffee, GraduationCap, Store } from 'lucide-react';

const Features: React.FC = () => {
    const features = [
        { title: "Design", desc: "Editorial-grade typography and spacing.", icon: "Aa" },
        { title: "Analytics", desc: "Privacy-first metrics that matter.", icon: "📊" },
        { title: "Speed", desc: "Global edge caching for instant loads.", icon: "⚡" },
        { title: "SEO", desc: "Automatic optimization for search.", icon: "🔍" },
    ];

  return (
    <section id="features" className="py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((f, i) => (
                <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="p-5 sm:p-8 bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-3xl hover:border-jam-red/30 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 shadow-sm dark:bg-slate-900/40 dark:border-slate-800"
                >
                    <div className="text-2xl mb-4 grayscale group-hover:grayscale-0 transition-all">{f.icon}</div>
                    <h3 className="text-xl font-serif font-medium text-ink mb-2 dark:text-white">{f.title}</h3>
                    <p className="text-slate-500 font-light text-sm leading-relaxed dark:text-slate-400">{f.desc}</p>
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Features;