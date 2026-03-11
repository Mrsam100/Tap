import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Philosophy: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Label slide in
      const label = sectionRef.current!.querySelector('.phil-label');
      if (label) {
        gsap.fromTo(label,
          { opacity: 0, y: 20, letterSpacing: '0.5em' },
          {
            opacity: 1, y: 0, letterSpacing: '0.2em', duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: label, start: "top 85%" }
          }
        );
      }

      // Big quote reveal
      const quote = sectionRef.current!.querySelector('.phil-quote');
      if (quote) {
        gsap.fromTo(quote,
          { opacity: 0, y: 60 },
          {
            opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
            scrollTrigger: { trigger: quote, start: "top 80%" }
          }
        );
      }

      // Italic span color shift
      const italic = sectionRef.current!.querySelector('.phil-italic');
      if (italic) {
        gsap.fromTo(italic,
          { opacity: 0.3 },
          {
            opacity: 1, duration: 1.5, ease: "power2.out",
            scrollTrigger: { trigger: italic, start: "top 80%" }
          }
        );
      }

      // Grid items stagger from bottom
      const cards = sectionRef.current!.querySelectorAll('.phil-card');
      cards.forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 50, x: i % 2 === 0 ? -20 : 20 },
          {
            opacity: 1, y: 0, x: 0, duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 90%" },
            delay: i * 0.1
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 sm:py-40 px-4 sm:px-6 bg-ink dark:bg-black text-white relative overflow-hidden">
      {/* Abstract Background Element */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-slate-800 to-transparent rounded-full blur-[100px] opacity-30 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-t from-jam-red/20 to-transparent rounded-full blur-[80px] opacity-20 pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="phil-label text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-12">The Philosophy</h2>

        <p className="phil-quote text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-serif leading-tight mb-12 sm:mb-20">
          The internet has become noisy. <br/>
          <span className="phil-italic text-slate-500 italic">We are bringing the quiet back.</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 text-left border-t border-white/10 pt-10 sm:pt-16">
            <div className="phil-card group">
                <h3 className="text-2xl font-serif mb-4 text-white group-hover:text-jam-light transition-colors">No Distractions</h3>
                <p className="text-slate-400 leading-relaxed font-light text-base sm:text-lg">
                    We removed the popups, the banners, and the complex navigations.
                    What remains is your content, pure and simple. A signal in the noise.
                    We believe that your audience deserves your undivided attention.
                </p>
            </div>
            <div className="phil-card group">
                <h3 className="text-2xl font-serif mb-4 text-white group-hover:text-jam-light transition-colors">Radical Simplicity</h3>
                <p className="text-slate-400 leading-relaxed font-light text-base sm:text-lg">
                    You don't need a drag-and-drop editor with 500 widgets.
                    You need a page that works, looks beautiful by default, and converts visitors into connections.
                    We optimize for speed, clarity, and conversion.
                </p>
            </div>
            <div className="phil-card group">
                <h3 className="text-2xl font-serif mb-4 text-white group-hover:text-jam-light transition-colors">Ownership First</h3>
                <p className="text-slate-400 leading-relaxed font-light text-base sm:text-lg">
                    Your data is yours. Your audience is yours. We provide the platform, but you own the relationship.
                    Export your data anytime, use your own domain, and build on a foundation of trust.
                </p>
            </div>
            <div className="phil-card group">
                <h3 className="text-2xl font-serif mb-4 text-white group-hover:text-jam-light transition-colors">Built for Speed</h3>
                <p className="text-slate-400 leading-relaxed font-light text-base sm:text-lg">
                    A slow site is a dead site. Tap is built on a modern edge network, ensuring your page loads in milliseconds
                    anywhere in the world. Performance isn't a feature; it's a requirement.
                </p>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
