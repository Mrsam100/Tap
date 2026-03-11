import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Showcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const items = [
    {
        initial: "A",
        name: "Alex Chen",
        role: "Product Designer",
        bg: "bg-slate-900 dark:bg-slate-950",
        text: "text-white",
        accent: "bg-white/10 border border-white/10"
    },
    {
        initial: "S",
        name: "Studio 54",
        role: "Photography",
        bg: "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md",
        text: "text-ink dark:text-white border border-white/60 dark:border-slate-800",
        accent: "bg-slate-100 dark:bg-slate-800"
    },
    {
        initial: "G",
        name: "Green House",
        role: "Plant Shop",
        bg: "bg-[#0f281e]",
        text: "text-[#e2e8f0]",
        accent: "bg-[#2d5244] border border-white/5"
    },
    {
        initial: "M",
        name: "Modernist",
        role: "Architecture",
        bg: "bg-stone-100 dark:bg-stone-900",
        text: "text-stone-900 dark:text-stone-100",
        accent: "bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
    },
    {
        initial: "V",
        name: "Vibe Check",
        role: "Music Label",
        bg: "bg-indigo-900 dark:bg-indigo-950",
        text: "text-indigo-100",
        accent: "bg-indigo-800 dark:bg-indigo-900 border border-indigo-700"
    },
    {
        initial: "K",
        name: "Komorebi",
        role: "Tea House",
        bg: "bg-[#f5f5f0] dark:bg-[#1a1a15]",
        text: "text-[#5a5a40] dark:text-[#d1d1b8]",
        accent: "bg-[#e5e5df] dark:bg-[#2a2a20] border border-[#d5d5cf] dark:border-[#3a3a30]"
    },
  ];

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Title animation
      const heading = sectionRef.current!.querySelector('.showcase-heading');
      if (heading) {
        gsap.fromTo(heading,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: heading, start: "top 85%" }
          }
        );
      }

      // Staggered card entrance with rotation and scale
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          {
            opacity: 0,
            y: 100,
            rotateY: i % 2 === 0 ? -8 : 8,
            scale: 0.85,
            transformPerspective: 1000
          },
          {
            opacity: 1,
            y: 0,
            rotateY: 0,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
            },
            delay: i * 0.12,
          }
        );

        // Parallax float on scroll
        gsap.to(card, {
          y: (i % 2 === 0 ? -20 : -30),
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          }
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-32 px-4 sm:px-6 overflow-hidden bg-slate-50/50 dark:bg-black border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16 showcase-heading">
           <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4 sm:mb-6 text-ink dark:text-white">Built by you.</h2>
           <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-light text-lg">
             Join thousands of architects, designers, and founders who have found their home on the internet.
             From minimal portfolios to vibrant storefronts.
           </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {items.map((item, i) => (
                <div
                  key={i}
                  ref={el => { cardsRef.current[i] = el; }}
                  className={`rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 aspect-[9/16] relative shadow-2xl transition-all duration-500 hover:-translate-y-4 hover:shadow-3xl cursor-default group ${item.bg} ${item.text}`}
                >
                    <div className="h-full flex flex-col">
                        <div className={`w-16 h-16 rounded-full mb-6 flex items-center justify-center text-2xl font-serif italic backdrop-blur-md ${item.accent}`}>
                            {item.initial}
                        </div>
                        <h3 className="text-2xl font-serif font-bold mb-2">{item.name}</h3>
                        <p className="opacity-60 text-sm mb-8">{item.role}</p>

                        <div className="space-y-3 mt-auto">
                            {[1, 2, 3].map(n => (
                                <div key={n} className={`h-12 w-full rounded-xl backdrop-blur-md opacity-50 ${item.initial === 'S' || item.initial === 'K' || item.initial === 'M' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-white/10'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Showcase;
