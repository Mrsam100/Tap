import React from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { 
  Zap, Layout, Share2, Sparkles, Smartphone, Globe, 
  Search, Palette, BarChart3, Shield, MessageSquare, 
  Layers, MousePointer2, Rocket, Check
} from 'lucide-react';
import Button from '../components/ui/Button';

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="p-5 sm:p-8 rounded-2xl bg-white border border-slate-100 hover:border-jam-red/20 hover:shadow-xl transition-all group"
  >
    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-ink mb-6 group-hover:bg-jam-red group-hover:text-white transition-colors">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-serif font-medium text-ink mb-3">{title}</h3>
    <p className="text-slate-500 font-light leading-relaxed">{description}</p>
  </motion.div>
);

const Features: React.FC = () => {
  return (
    <div className="pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
      <Helmet>
        <title>Features — Tap AI Landing Page Builder</title>
        <meta name="description" content="Explore the powerful features of Tap. AI-powered generation, customizable themes, real-time analytics, and more." />
      </Helmet>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 rounded-full bg-jam-red/10 text-jam-red text-xs font-bold uppercase tracking-widest mb-6"
        >
          Powerful Capabilities
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-7xl font-serif text-ink mb-8 leading-tight"
        >
          Everything you need to <br/>
          <span className="italic font-light">launch in seconds.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-xl text-slate-500 font-light max-w-2xl mx-auto"
        >
          Tap combines the power of AI with a world-class design system to help you build a professional presence without the overhead.
        </motion.p>
      </div>

      {/* Main Features Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-20 sm:mb-32">
        <FeatureCard 
          icon={Sparkles}
          title="AI-Powered Generation"
          description="Just type what you do. Our AI analyzes your intent and builds a complete, high-converting page automatically."
          delay={0.1}
        />
        <FeatureCard 
          icon={Layout}
          title="Modern Templates"
          description="Choose from a curated library of themes designed for clarity and conversion. Every template is mobile-first."
          delay={0.2}
        />
        <FeatureCard 
          icon={Palette}
          title="Deep Customization"
          description="Fine-tune every detail. From typography and colors to interactive fluid backgrounds and custom avatars."
          delay={0.3}
        />
        <FeatureCard 
          icon={Search}
          title="SEO & AEO Optimized"
          description="Built-in tools for meta tags, structured data, and answer engine optimization to ensure you're found."
          delay={0.4}
        />
        <FeatureCard 
          icon={Smartphone}
          title="Mobile First Design"
          description="Your page looks stunning on every device. No more pinching or zooming—just seamless browsing."
          delay={0.5}
        />
        <FeatureCard 
          icon={BarChart3}
          title="Real-time Analytics"
          description="Track your performance with privacy-first analytics. See where your traffic comes from and what they click."
          delay={0.6}
        />
      </div>

      {/* Detailed Section: AI Engine */}
      <div className="max-w-7xl mx-auto mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-ink mb-6">The AI engine that <br className="hidden sm:block"/> understands you.</h2>
            <p className="text-lg text-slate-500 font-light mb-8 leading-relaxed">
              Our proprietary AI model doesn't just generate text; it understands the structure of a successful business page. It selects the right components, writes compelling copy, and organizes your links for maximum impact.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                "Context-aware copywriting",
                "Automatic icon selection",
                "Smart layout structuring",
                "Brand-aligned color palettes"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-ink font-medium">
                  <div className="w-5 h-5 rounded-full bg-jam-red flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Button size="lg">Try the AI Builder</Button>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl bg-cream border border-slate-200 overflow-hidden shadow-2xl">
              <img 
                src="https://picsum.photos/seed/ai-builder/800/800" 
                alt="AI Builder Interface" 
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cream/80 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-white shadow-xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-jam-red animate-pulse"></div>
                  <div className="h-4 w-32 bg-slate-100 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-50 rounded"></div>
                  <div className="h-3 w-4/5 bg-slate-50 rounded"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-5xl mx-auto rounded-3xl bg-ink p-8 sm:p-12 md:p-20 text-center text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-jam-red rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-jam-red rounded-full blur-[100px]"></div>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif mb-8 relative z-10">Ready to build your <br className="hidden sm:block"/> digital home?</h2>
        <p className="text-xl text-slate-400 font-light mb-12 max-w-2xl mx-auto relative z-10">
          Join thousands of creators who have simplified their online presence with Tap.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
          <Button size="lg" className="bg-white text-ink hover:bg-slate-100 w-full md:w-auto">Get Started Free</Button>
          <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full md:w-auto">View Demo</Button>
        </div>
      </div>
    </div>
  );
};

export default Features;
