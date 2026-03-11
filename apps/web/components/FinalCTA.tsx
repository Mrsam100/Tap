import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Button from './ui/Button';

gsap.registerPlugin(ScrollTrigger);

const FinalCTA: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Jam jar icon animation
      const jar = sectionRef.current!.querySelector('.cta-jar');
      if (jar) {
        gsap.fromTo(jar,
          { opacity: 0, scale: 0.5, rotate: -15 },
          {
            opacity: 0.2, scale: 1, rotate: 0, duration: 1, ease: "back.out(1.7)",
            scrollTrigger: { trigger: jar, start: "top 90%" }
          }
        );
      }

      // Headline with split reveal
      const headline = sectionRef.current!.querySelector('.cta-headline');
      if (headline) {
        gsap.fromTo(headline,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "power4.out",
            scrollTrigger: { trigger: headline, start: "top 85%" }
          }
        );
      }

      // Button entrance
      const btn = sectionRef.current!.querySelector('.cta-btn');
      if (btn) {
        gsap.fromTo(btn,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.5)",
            scrollTrigger: { trigger: btn, start: "top 90%" },
            delay: 0.3
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 sm:py-40 px-4 sm:px-6 text-center bg-cream dark:bg-black">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
             <div className="cta-jar flex flex-col gap-1 mb-8 opacity-20 hover:opacity-100 transition-opacity duration-700 cursor-pointer">
                 <div className="w-16 h-8 bg-jam-red rounded-full"></div>
                 <div className="w-16 h-8 border-2 border-jam-red rounded-full"></div>
                 <div className="w-16 h-8 border-2 border-jam-red rounded-full"></div>
             </div>

            <h2 className="cta-headline text-4xl sm:text-6xl md:text-8xl font-serif text-ink dark:text-white mb-8 sm:mb-12 tracking-tight">
                Spread like <span className="italic text-jam-red">Jam.</span>
            </h2>

            <div className="cta-btn">
              <Button
                  size="lg"
                  onClick={() => navigate('/build')}
                  className="px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg rounded-full hover:scale-105 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              >
                  Spread now
              </Button>
            </div>
        </div>
    </section>
  );
};

export default FinalCTA;
