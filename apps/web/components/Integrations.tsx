import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Twitter, Instagram, Linkedin, Github, Youtube, Mail, Facebook, Ghost, Search, Globe } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Integrations: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const integrations = [
    { name: 'Twitter', icon: Twitter, color: 'text-sky-500' },
    { name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
    { name: 'GitHub', icon: Github, color: 'text-slate-900 dark:text-white' },
    { name: 'YouTube', icon: Youtube, color: 'text-red-600' },
    { name: 'Email', icon: Mail, color: 'text-slate-500' },
    { name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { name: 'Snapchat', icon: Ghost, color: 'text-yellow-400' },
    { name: 'Google Search', icon: Search, color: 'text-blue-500' },
    { name: 'Custom Domain', icon: Globe, color: 'text-emerald-500' }
  ];

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Heading
      const heading = sectionRef.current!.querySelector('.int-heading');
      if (heading) {
        gsap.fromTo(heading,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: heading, start: "top 85%" }
          }
        );
      }

      // Cards wave entrance
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 40, scale: 0.8, rotateY: 15 },
          {
            opacity: 1, y: 0, scale: 1, rotateY: 0,
            duration: 0.6, ease: "back.out(1.5)",
            scrollTrigger: { trigger: sectionRef.current!.querySelector('.int-grid'), start: "top 85%" },
            delay: i * 0.08
          }
        );
      });

      // Magnetic hover effect
      cardsRef.current.forEach((card) => {
        if (!card) return;
        const handleMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(card, { x: x * 0.15, y: y * 0.15, duration: 0.3, ease: "power2.out" });
        };
        const handleLeave = () => {
          gsap.to(card, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
        };
        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseleave', handleLeave);
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-32 px-4 sm:px-6 bg-white dark:bg-black border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="int-heading text-center mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-ink dark:text-white mb-4 sm:mb-6">Integrates with your stack.</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-light text-lg">
            Tap works seamlessly with all your favorite tools and platforms.
            Connect your audience to everything you do in one place.
          </p>
        </div>

        <div className="int-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-8">
          {integrations.map((item, i) => (
            <div
              key={i}
              ref={el => { cardsRef.current[i] = el; }}
              className="p-5 sm:p-8 rounded-2xl sm:rounded-[32px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center transition-shadow group hover:shadow-xl cursor-default"
            >
              <item.icon size={32} className={`${item.color} mb-3 sm:mb-4 group-hover:scale-110 transition-transform sm:w-10 sm:h-10`} />
              <span className="text-[10px] sm:text-sm font-bold text-ink dark:text-white uppercase tracking-wider sm:tracking-widest text-center">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
