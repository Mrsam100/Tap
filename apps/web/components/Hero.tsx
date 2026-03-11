import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import gsap from 'gsap';
import Button from './ui/Button';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const words = ["builders", "creators", "founders", "makers", "artists", "designers"];
  const [index, setIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // GSAP entrance timeline
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // Badge slides down
      tl.fromTo(badgeRef.current,
        { opacity: 0, y: -30, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6 }
      );

      // Headline chars reveal with 3D rotation
      if (headlineRef.current) {
        const lines = headlineRef.current.querySelectorAll('.hero-line');
        lines.forEach((line, i) => {
          tl.fromTo(line,
            { opacity: 0, y: 60, rotateX: -40, transformPerspective: 800 },
            { opacity: 1, y: 0, rotateX: 0, duration: 1, ease: "power3.out" },
            i === 0 ? "-=0.1" : "-=0.6"
          );
        });
      }

      // Subtext fades in
      tl.fromTo(subtextRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8 },
        "-=0.4"
      );

      // CTA scales in with bounce
      tl.fromTo(ctaRef.current,
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.7)" },
        "-=0.3"
      );

      // Scroll indicator fades in last
      tl.fromTo(scrollRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        "-=0.1"
      );

      // Floating scroll indicator loop
      gsap.to(scrollRef.current, {
        y: 8,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: 2
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Word change animation with GSAP
  useEffect(() => {
    if (!wordRef.current) return;
    gsap.fromTo(wordRef.current,
      { opacity: 0, y: 15, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out" }
    );
  }, [index]);

  return (
    <section ref={sectionRef} className="pt-32 sm:pt-40 md:pt-48 pb-20 sm:pb-32 px-4 sm:px-6 text-center overflow-hidden relative">
        <Helmet>
          <title>Tap — The Business Page Built for Creators</title>
          <meta name="description" content="Type what you do. AI builds your page. Share the link. Simple, elegant, and effective business pages for founders and builders." />
          <meta name="keywords" content="AI website builder, landing page for creators, link in bio alternative, personal brand website, architect portfolio, designer portfolio" />
          <link rel="canonical" href="https://tap.bio/" />

          {/* Open Graph / Facebook */}
          <meta property="og:title" content="Tap — Spread like Jam" />
          <meta property="og:description" content="Instant, AI-powered business pages for the modern creator." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://tap.bio/" />
          <meta property="og:image" content="https://picsum.photos/seed/tap-hero/1200/630" />

          {/* Localized content hints for GEO */}
          <meta property="business:contact_data:country_name" content="Global" />
          <meta property="og:locality" content="San Francisco" />
          <meta property="og:region" content="CA" />
          <meta property="og:country-name" content="USA" />

          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Tap",
              "operatingSystem": "Web",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1250"
              }
            })}
          </script>
        </Helmet>

        <div className="max-w-4xl mx-auto flex flex-col items-center">

            {/* Trust Badge */}
            <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-10 opacity-0">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-wide uppercase">Trusted by 12,000+ creators</span>
            </div>

            {/* Headline */}
            <h1
              ref={headlineRef}
              className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-ink leading-[1.1] mb-8 sm:mb-12 font-serif font-medium tracking-tight dark:text-white"
            >
                <span className="hero-line inline-block opacity-0">The business page built</span> <br/>
                <span className="hero-line inline-block opacity-0">
                  for{' '}
                  <span className="relative inline-block italic font-light min-w-[120px] sm:min-w-[200px] md:min-w-[280px] text-left md:text-center">
                    <span
                      ref={wordRef}
                      key={words[index]}
                      className="inline-block text-jam-red"
                    >
                      {words[index]}
                    </span>
                    <span className="absolute -bottom-2 left-0 w-full h-[3px] bg-jam-red/30 rounded-full" />
                  </span>
                </span>
            </h1>

            {/* Subtext */}
            <p
              ref={subtextRef}
              className="text-base sm:text-lg md:text-xl text-slate-500 max-w-xl mb-8 sm:mb-12 leading-relaxed font-sans font-light dark:text-slate-400 opacity-0 px-2 sm:px-0"
            >
                Type what you do. AI builds your page. Share the link.
                Simple, elegant, and effective.
            </p>

            {/* CTA */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row items-center gap-4 opacity-0">
                <Button
                    size="lg"
                    onClick={() => navigate('/build')}
                    className="px-10 py-4 text-base rounded-full bg-ink hover:bg-black text-white hover:scale-105 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 dark:bg-white dark:text-black dark:hover:bg-slate-200"
                >
                    Start Building
                </Button>
                <button
                  onClick={() => {
                    const el = document.getElementById('features');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 text-base rounded-full border border-slate-300 dark:border-slate-600 text-ink dark:text-white hover:border-jam-red hover:text-jam-red transition-all duration-300 font-medium"
                >
                    See how it works
                </button>
            </div>
            <div className="text-sm text-slate-400 font-sans mt-4">
                No credit card required
            </div>

            {/* Scroll indicator */}
            <div ref={scrollRef} className="mt-12 sm:mt-20 opacity-0 hidden sm:flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold">Scroll</span>
              <div className="w-5 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-start justify-center pt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-jam-red" />
              </div>
            </div>
        </div>
    </section>
  );
};

export default Hero;
