import React from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Check, X, Zap, Layout, Share2, Sparkles, Smartphone, Globe, Search, Palette, BarChart3, Shield, MessageSquare, Layers, MousePointer2, Rocket } from 'lucide-react';
import Button from '../components/ui/Button';

const PricingTier = ({ title, price, description, features, cta, popular = false, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`p-6 sm:p-10 rounded-2xl sm:rounded-3xl border ${popular ? 'border-jam-red bg-white shadow-2xl md:scale-105' : 'border-slate-100 bg-slate-50'} relative overflow-hidden flex flex-col`}
  >
    {popular && (
      <div className="absolute top-0 right-0 bg-jam-red text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
        Most Popular
      </div>
    )}
    <div className="mb-8">
      <h3 className="text-2xl font-serif font-medium text-ink mb-2">{title}</h3>
      <p className="text-slate-500 font-light text-sm">{description}</p>
    </div>
    <div className="mb-10">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl md:text-5xl font-serif font-bold text-ink">${price}</span>
        <span className="text-slate-400 font-light">/month</span>
      </div>
      <p className="text-xs text-slate-400 mt-2">Billed annually</p>
    </div>
    <ul className="space-y-4 mb-12 flex-grow">
      {features.map((feature: any, i: number) => (
        <li key={i} className="flex items-start gap-3 text-sm text-ink group">
          {feature.included ? (
            <div className="w-5 h-5 rounded-full bg-jam-red/10 flex items-center justify-center text-jam-red shrink-0 group-hover:bg-jam-red group-hover:text-white transition-colors">
              <Check size={12} strokeWidth={3} />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
              <X size={12} strokeWidth={3} />
            </div>
          )}
          <span className={feature.included ? 'text-ink' : 'text-slate-400 line-through'}>{feature.text}</span>
        </li>
      ))}
    </ul>
    <Button 
      size="lg" 
      variant={popular ? 'primary' : 'outline'}
      className="w-full"
    >
      {cta}
    </Button>
  </motion.div>
);

const Pricing: React.FC = () => {
  return (
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
      <Helmet>
        <title>Pricing — Tap AI Landing Page Builder</title>
        <meta name="description" content="Simple, transparent pricing for creators and businesses. Start for free and upgrade as you grow." />
      </Helmet>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-16 sm:mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 rounded-full bg-jam-red/10 text-jam-red text-xs font-bold uppercase tracking-widest mb-6"
        >
          Transparent Pricing
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-7xl font-serif text-ink mb-6 sm:mb-8 leading-tight"
        >
          Simple plans for <br/>
          <span className="italic font-light">every stage of growth.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-xl text-slate-500 font-light max-w-2xl mx-auto"
        >
          Start for free, upgrade when you need more power. No hidden fees, no credit card required to start.
        </motion.p>
      </div>

      {/* Pricing Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-20 sm:mb-32 items-start">
        <PricingTier 
          title="Free"
          price="0"
          description="Perfect for individuals just starting their journey."
          features={[
            { text: "1 AI-generated page", included: true },
            { text: "Standard templates", included: true },
            { text: "Tap.bio subdomain", included: true },
            { text: "Basic analytics", included: true },
            { text: "Custom domain", included: false },
            { text: "Advanced SEO tools", included: false },
            { text: "Remove Tap branding", included: false }
          ]}
          cta="Get Started Free"
          delay={0.1}
        />
        <PricingTier 
          title="Pro"
          price="12"
          description="For creators who want to build a serious brand."
          popular={true}
          features={[
            { text: "Unlimited AI pages", included: true },
            { text: "All premium templates", included: true },
            { text: "Custom domain support", included: true },
            { text: "Advanced analytics", included: true },
            { text: "Full SEO & AEO tools", included: true },
            { text: "Remove Tap branding", included: true },
            { text: "Priority support", included: true }
          ]}
          cta="Upgrade to Pro"
          delay={0.2}
        />
        <PricingTier 
          title="Business"
          price="49"
          description="Scale your business with advanced tools and team features."
          features={[
            { text: "Everything in Pro", included: true },
            { text: "Team collaboration", included: true },
            { text: "API access", included: true },
            { text: "White-label solution", included: true },
            { text: "Custom integrations", included: true },
            { text: "Dedicated account manager", included: true },
            { text: "SLA guarantee", included: true }
          ]}
          cta="Contact Sales"
          delay={0.3}
        />
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mb-20 sm:mb-32">
        <h2 className="text-3xl sm:text-4xl font-serif text-ink mb-8 sm:mb-12 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            { q: "Can I change my plan later?", a: "Yes, you can upgrade or downgrade your plan at any time from your dashboard settings." },
            { q: "Do you offer a student discount?", a: "We offer a 50% discount for students and non-profits. Contact our support team to verify your status." },
            { q: "What happens if I cancel my subscription?", a: "Your page will remain active until the end of your billing cycle, after which it will revert to the Free plan features." },
            { q: "Is there a limit on traffic?", a: "We don't limit traffic on any of our plans. Whether you have 10 or 10 million visitors, we've got you covered." }
          ].map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-5 sm:p-8 rounded-2xl bg-white border border-slate-100"
            >
              <h3 className="text-lg font-bold text-ink mb-3">{faq.q}</h3>
              <p className="text-slate-500 font-light leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-5xl mx-auto mb-20 sm:mb-32 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-6 px-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Feature</th>
              <th className="py-6 px-4 text-sm font-bold text-ink uppercase tracking-widest">Free</th>
              <th className="py-6 px-4 text-sm font-bold text-ink uppercase tracking-widest">Pro</th>
              <th className="py-6 px-4 text-sm font-bold text-ink uppercase tracking-widest">Business</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "AI Page Generation", free: "1 Page", pro: "Unlimited", biz: "Unlimited" },
              { name: "Custom Domain", free: "No", pro: "Yes", biz: "Yes" },
              { name: "Analytics", free: "Basic", pro: "Advanced", biz: "Real-time" },
              { name: "Branding", free: "Tap.bio logo", pro: "Custom", biz: "White-label" },
              { name: "Support", free: "Email", pro: "Priority", biz: "24/7 Dedicated" }
            ].map((row, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-6 px-4 text-ink font-medium">{row.name}</td>
                <td className="py-6 px-4 text-slate-500 font-light">{row.free}</td>
                <td className="py-6 px-4 text-slate-500 font-light">{row.pro}</td>
                <td className="py-6 px-4 text-slate-500 font-light">{row.biz}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pricing;
