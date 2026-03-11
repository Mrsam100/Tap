import React from 'react';
import { motion } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const faqs = [
    {
      q: "How does the AI builder work?",
      a: "Our AI analyzes your business description and automatically generates a structure, copy, and design that fits your brand. You can then refine it in our intuitive builder."
    },
    {
      q: "Can I use my own domain?",
      a: "Yes! While we provide a free tap.bio/yourname link, our Enterprise plan allows you to connect any custom domain with full SSL support."
    },
    {
      q: "Is Tap really free forever?",
      a: "Absolutely. Our 'Standard' plan is free forever with no hidden costs. We make money through our Enterprise features for larger teams and brands."
    },
    {
      q: "How do I claim my unique link?",
      a: "Simply start building your page. Once you're happy with the result, click 'Publish' and you'll be prompted to claim your unique URL."
    },
    {
      q: "Can I integrate with my existing tools?",
      a: "Yes, Tap integrates with all major social platforms, email marketing tools, and analytics providers like Google Analytics and Meta Pixel."
    }
  ];

  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 bg-cream dark:bg-black border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-ink dark:text-white mb-10 sm:mb-16 text-center">Common Questions</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left group"
              >
                <span className="text-lg sm:text-xl font-serif text-ink dark:text-white group-hover:text-jam-red transition-colors">{faq.q}</span>
                {openIndex === i ? <Minus size={20} className="text-jam-red" /> : <Plus size={20} className="text-slate-400" />}
              </button>
              
              {openIndex === i && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed pb-4">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
