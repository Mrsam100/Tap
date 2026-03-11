import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Testimonials: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const testimonials = [
    {
      text: "Tap is the cleanest way to present my work. It feels less like a link-in-bio tool and more like a personal publication.",
      author: "Elena Richards",
      role: "Architect, London",
      avatar: "ER"
    },
    {
      text: "The AI builder is actually useful. It gave me a foundation that I could refine in minutes rather than hours of dragging boxes.",
      author: "Marcus Thorne",
      role: "Founder, Vibe Check",
      avatar: "MT"
    },
    {
      text: "Finally, a tool that respects design. My Tap page looks better than my actual website, and it was 10x easier to build.",
      author: "Sarah Jenkins",
      role: "Digital Artist",
      avatar: "SJ"
    }
  ];

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Heading
      const heading = sectionRef.current!.querySelector('.test-heading');
      if (heading) {
        gsap.fromTo(heading,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: heading, start: "top 85%" }
          }
        );
      }

      // Cards stagger with slight rotation
      const cards = sectionRef.current!.querySelectorAll('.test-card');
      cards.forEach((card, i) => {
        gsap.fromTo(card,
          {
            opacity: 0,
            y: 60,
            rotateZ: i === 0 ? -2 : i === 2 ? 2 : 0,
            scale: 0.92
          },
          {
            opacity: 1, y: 0, rotateZ: 0, scale: 1,
            duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 90%" },
            delay: i * 0.15
          }
        );

        // Quote mark animation
        const quote = card.querySelector('.test-quote');
        if (quote) {
          gsap.fromTo(quote,
            { opacity: 0, scale: 2 },
            {
              opacity: 0.1, scale: 1, duration: 0.8, ease: "power2.out",
              scrollTrigger: { trigger: card, start: "top 90%" },
              delay: i * 0.15 + 0.3
            }
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-32 px-4 sm:px-6 bg-cream dark:bg-black border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
            <h2 className="test-heading text-3xl sm:text-4xl md:text-5xl font-serif text-ink dark:text-white mb-12 sm:mb-20 text-center">Loved by creators.</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
                {testimonials.map((t, i) => (
                    <div key={i} className="test-card flex flex-col relative">
                        {/* Decorative quote mark */}
                        <span className="test-quote absolute -top-4 -left-2 text-8xl font-serif text-ink dark:text-white opacity-0 pointer-events-none select-none">&ldquo;</span>

                        <p className="text-lg sm:text-xl font-serif italic text-ink dark:text-white leading-tight mb-6 sm:mb-8">
                            &ldquo;{t.text}&rdquo;
                        </p>
                        <div className="flex items-center gap-4 mt-auto">
                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                                {t.avatar}
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold text-ink dark:text-white font-sans">{t.author}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">{t.role}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

export default Testimonials;
