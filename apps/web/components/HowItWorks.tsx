import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HowItWorks: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const steps = [
    { num: "01", title: "Describe", desc: "Tell Tap what you do in plain English. Our AI understands your business context, target audience, and unique value proposition." },
    { num: "02", title: "Refine", desc: "AI generates the structure, copy, and visual style. You tweak it with our intuitive builder to make it perfectly yours." },
    { num: "03", title: "Launch", desc: "Claim your unique link and share it with the world. Your site is optimized for speed, SEO, and social sharing by default." }
  ];

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Title entrance
      const heading = sectionRef.current!.querySelector('.hiw-heading');
      if (heading) {
        gsap.fromTo(heading,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: heading, start: "top 85%" }
          }
        );
      }

      // Steps: stagger entrance with counting number animation
      const stepEls = sectionRef.current!.querySelectorAll('.hiw-step');
      stepEls.forEach((step, i) => {
        gsap.fromTo(step,
          { opacity: 0, y: 60, scale: 0.9 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.4)",
            scrollTrigger: { trigger: step, start: "top 88%" },
            delay: i * 0.2
          }
        );

        // Step number pulse on enter
        const badge = step.querySelector('.hiw-badge');
        if (badge) {
          gsap.fromTo(badge,
            { scale: 0, rotate: -20 },
            {
              scale: 1, rotate: 0, duration: 0.6, ease: "back.out(2)",
              scrollTrigger: { trigger: step, start: "top 88%" },
              delay: i * 0.2 + 0.3
            }
          );
        }
      });

      // Connecting line animation between steps
      const line = sectionRef.current!.querySelector('.hiw-line');
      if (line) {
        gsap.fromTo(line,
          { scaleX: 0 },
          {
            scaleX: 1, duration: 1.5, ease: "power2.inOut",
            scrollTrigger: { trigger: line, start: "top 85%" }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-32 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-black">
       <div className="max-w-4xl mx-auto text-center">
            <h2 className="hiw-heading text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-ink dark:text-white mb-10 sm:mb-16">
                From idea to live <br/> in three steps.
            </h2>

            {/* Connecting line (desktop only) */}
            <div className="hidden md:block hiw-line h-[2px] bg-gradient-to-r from-transparent via-jam-red/30 to-transparent mb-12 origin-left" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
                {steps.map((step) => (
                    <div key={step.num} className="hiw-step flex flex-col items-center">
                        <div className="hiw-badge text-xs font-bold text-jam-red tracking-widest mb-4 border border-jam-red/20 rounded-full px-3 py-1 bg-jam-red/5">STEP {step.num}</div>
                        <h3 className="text-2xl font-serif text-ink dark:text-white mb-3">{step.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                            {step.desc}
                        </p>
                    </div>
                ))}
            </div>
       </div>
    </section>
  );
};

export default HowItWorks;
