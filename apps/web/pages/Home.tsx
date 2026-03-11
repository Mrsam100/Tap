import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from '../components/Hero';
import PhoneSection from '../components/PhoneSection';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import Blog from '../components/Blog';
import FinalCTA from '../components/FinalCTA';
import Showcase from '../components/Showcase';
import Philosophy from '../components/Philosophy';
import FAQ from '../components/FAQ';
import Integrations from '../components/Integrations';
import FluidBackground from '../components/FluidBackground';

gsap.registerPlugin(ScrollTrigger);

const Home: React.FC = () => {
  const { hash } = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Only target sections that opt-in via .gsap-section class
      // This avoids conflicting with components that have their own animations
      const sections = containerRef.current!.querySelectorAll('.gsap-section');
      sections.forEach((section) => {
        gsap.fromTo(section,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              toggleActions: "play none none none",
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
        window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="relative min-h-screen" ref={containerRef}>
      <FluidBackground />
      <div className="relative z-10">
        <Hero />
        <PhoneSection />
        <Showcase />
        <div id="features"><Features /></div>
        <Philosophy />
        <Integrations />
        <HowItWorks />
        <Testimonials />
        <div id="pricing" className="gsap-section"><Pricing /></div>
        <FAQ />
        <div id="blog" className="gsap-section"><Blog /></div>
        <FinalCTA />
      </div>
    </div>
  );
};

export default Home;
