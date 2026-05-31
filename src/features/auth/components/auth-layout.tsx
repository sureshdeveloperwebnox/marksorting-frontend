'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Globe, 
  ShieldCheck, 
  Rocket, 
  Headset, 
  Shield, 
  Users, 
  Award, 
  ThumbsUp 
} from 'lucide-react';
import { gsap } from 'gsap';
import { Antigravity } from '@/components/Antigravity';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const [mounted, setMounted] = React.useState(false);

  const sidecardRef = React.useRef<HTMLDivElement>(null);
  const logoRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const textRef = React.useRef<HTMLParagraphElement>(null);
  const dividerRef = React.useRef<HTMLDivElement>(null);
  const interactiveGlowRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    // 1. Entry Stagger Animation using GSAP
    const tl = gsap.timeline();
    
    // Quick hide to prevent flash of content before GSAP handles it
    gsap.set([logoRef.current, titleRef.current, dividerRef.current, textRef.current], { opacity: 0 });
    gsap.set('.footer-stat-item', { opacity: 0 });

    tl.fromTo(logoRef.current, 
      { opacity: 0, scale: 0.8, y: -25 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' }
    );
    tl.fromTo(titleRef.current,
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.4'
    );
    tl.fromTo(dividerRef.current,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, transformOrigin: 'left center', duration: 0.5, ease: 'power2.out' },
      '-=0.5'
    );
    tl.fromTo(textRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.4'
    );
    tl.fromTo('.footer-stat-item',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
      '-=0.3'
    );

    // 2. Interactive Parallax and Mouse Tracking Glow
    const sidecard = sidecardRef.current;
    if (!sidecard) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = sidecard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -8; // Tilt up to 8 degrees
      const rotateY = ((x - centerX) / centerX) * 8;  // Tilt up to 8 degrees

      // Tilt the text container
      gsap.to('.sidecard-interactive-content', {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 800,
        ease: 'power2.out',
        duration: 0.4
      });

      // Smoothly follow cursor with glow spotlight
      gsap.to(interactiveGlowRef.current, {
        left: x,
        top: y,
        opacity: 1,
        scale: 1,
        ease: 'power2.out',
        duration: 0.4
      });
    };

    const handleMouseLeave = () => {
      // Reset text tilt
      gsap.to('.sidecard-interactive-content', {
        rotateX: 0,
        rotateY: 0,
        ease: 'power3.out',
        duration: 0.8
      });

      // Hide glow spotlight
      gsap.to(interactiveGlowRef.current, {
        opacity: 0,
        scale: 0.8,
        ease: 'power3.out',
        duration: 0.8
      });
    };

    sidecard.addEventListener('mousemove', handleMouseMove);
    sidecard.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      sidecard.removeEventListener('mousemove', handleMouseMove);
      sidecard.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mounted]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f7f8fa] dark:bg-[#0a0a0a]">
      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left Side: Animated Brand Experience (Hidden on Mobile) */}
        <div 
          ref={sidecardRef}
          className="hidden lg:flex lg:w-[48%] xl:w-[50%] h-full relative bg-gradient-to-br from-[#e04a00] via-[#c63400] to-[#3a0600] overflow-hidden p-8 xl:p-12 flex-col justify-between"
          style={{ perspective: '1000px' }}
        >
          {/* Antigravity interactive background */}
          {mounted && (
            <div className="absolute inset-0 z-0 opacity-70 pointer-events-none select-none">
              <Antigravity
                count={250}
                magnetRadius={12}
                ringRadius={8}
                waveSpeed={0.3}
                waveAmplitude={1.2}
                particleSize={1.5}
                lerpSpeed={0.06}
                color="#ffa066"
                autoAnimate={true}
                particleVariance={1.2}
                rotationSpeed={0.01}
                depthFactor={1.2}
                pulseSpeed={2.5}
                particleShape="capsule"
                fieldStrength={8}
              />
            </div>
          )}

          {/* Mouse follow spotlight glow */}
          <div 
            ref={interactiveGlowRef}
            className="absolute pointer-events-none rounded-full blur-[100px] bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,transparent_70%)] w-[350px] h-[350px] -translate-x-1/2 -translate-y-1/2 opacity-0 z-1" 
          />

          {/* Animated Background Grid & Radial Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)] z-2 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.3)_0%,transparent_50%)] z-2 pointer-events-none" />
          
          {/* Dot Grid overlay representing world map coordinates */}
          <div 
            className="absolute inset-0 opacity-[0.1] mix-blend-overlay z-2 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Dotted World Map Silhouette SVG Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none z-2">
            <svg width="100%" height="80%" viewBox="0 0 1000 500" fill="currentColor" className="text-white">
              {/* Abstract map pattern dots */}
              <circle cx="150" cy="180" r="4" />
              <circle cx="170" cy="190" r="4" />
              <circle cx="180" cy="170" r="4" />
              <circle cx="190" cy="200" r="4" />
              <circle cx="210" cy="220" r="4" />
              <circle cx="230" cy="230" r="4" />
              <circle cx="250" cy="240" r="4" />
              <circle cx="270" cy="220" r="4" />
              <circle cx="300" cy="210" r="4" />
              <circle cx="350" cy="150" r="4" />
              <circle cx="370" cy="140" r="4" />
              <circle cx="390" cy="160" r="4" />
              <circle cx="410" cy="180" r="4" />
              <circle cx="430" cy="200" r="4" />
              <circle cx="450" cy="210" r="4" />
              <circle cx="470" cy="190" r="4" />
              <circle cx="490" cy="180" r="4" />
              <circle cx="510" cy="170" r="4" />
              <circle cx="530" cy="190" r="4" />
              <circle cx="550" cy="210" r="4" />
              <circle cx="570" cy="220" r="4" />
              <circle cx="590" cy="240" r="4" />
              <circle cx="610" cy="220" r="4" />
              <circle cx="630" cy="200" r="4" />
              <circle cx="650" cy="190" r="4" />
              <circle cx="670" cy="180" r="4" />
              <circle cx="690" cy="170" r="4" />
              <circle cx="710" cy="190" r="4" />
              <circle cx="730" cy="210" r="4" />
              <circle cx="750" cy="220" r="4" />
              <circle cx="780" cy="200" r="4" />
              <circle cx="800" cy="180" r="4" />
              <circle cx="820" cy="190" r="4" />
              <circle cx="840" cy="170" r="4" />
              <circle cx="860" cy="210" r="4" />
              <circle cx="880" cy="230" r="4" />
              <circle cx="900" cy="240" r="4" />
            </svg>
          </div>

          {/* Glowing parallel wave lines tracing the curved divider */}
          <svg className="absolute right-[30px] top-0 h-full w-[100px] stroke-white/10 stroke-[1.5] fill-none pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M100,-10 C45,10 15,30 48,50 C78,65 58,80 98,110" />
          </svg>
          <svg className="absolute right-[45px] top-0 h-full w-[100px] stroke-[#ff6b00]/30 stroke-[1.5] fill-none pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M100,-20 C40,8 10,28 43,48 C73,63 53,78 93,120" />
          </svg>

          {/* Organic separation curve covering the right side of left pane */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute right-[-1px] top-0 h-full w-[80px] text-[#f7f8fa] dark:text-[#0a0a0a] fill-current z-20 pointer-events-none">
            <path d="M100,0 C45,18 20,38 52,50 C82,62 60,82 100,100 Z" />
          </svg>

          {/* Top-Left Logo */}
          <div ref={logoRef} className="z-30 shrink-0 mb-4 select-none mt-4 pointer-events-none">
            <div className="bg-white shadow-lg flex items-center justify-center overflow-hidden rounded-2xl p-3 w-44 h-16 relative">
              <div className="relative w-full h-full">
                <Image
                  src="/assets/logo.png"
                  alt="Mark Sorting System"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
          
          {/* Left Side Content Container - Interactive tilting */}
          <div className="relative z-30 w-full max-w-md flex-1 min-h-0 flex flex-col justify-center py-2 pointer-events-none">
            <div
              className="sidecard-interactive-content space-y-4"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="space-y-3">
                <h1 ref={titleRef} className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
                  Revolutionizing
                  <span className="block text-[#ff7c30] mt-1">Food Processing.</span>
                </h1>
                <div ref={dividerRef} className="w-16 h-1 bg-[#ff5a00] rounded-full" />
                <p ref={textRef} className="text-white/80 text-base xl:text-lg font-medium leading-relaxed max-w-sm pt-2">
                  Promech Industries delivers international standard color sorting solutions to the global market since 2005.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean, High-End Floating Form Card Area - Scrollable if it overflows */}
        <div className="flex-1 h-full overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-[500px] bg-white dark:bg-[#111] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-white/5 p-8 sm:p-10 relative z-10 my-auto">
            {/* Header logo, title and subtitle inside the white card */}
            <div className="flex flex-col items-center mb-8">
              {/* Centered logo */}
              <div className="relative w-40 h-14 mb-2">
                <Image
                  src="/assets/logo.png"
                  alt="Mark Sorting System"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              {/* Orange indicator dot below the logo */}
              <div className="w-1.5 h-1.5 bg-[#ff6b00] rounded-full mb-4" />
              
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {title}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm leading-relaxed max-w-sm">
                  {subtitle}
                </p>
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>

      {/* Bottom Statistics / Copyright Footer Bar */}
      <footer className="w-full bg-[#f4f5f7] dark:bg-[#0c0c0d] border-t border-gray-200/60 dark:border-white/5 px-6 sm:px-12 py-3 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 shrink-0 z-30">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            { icon: Users, num: '500+', label: 'Happy Clients' },
            { icon: Globe, num: '50+', label: 'Countries Served' },
            { icon: Award, num: '20+', label: 'Years of Excellence' },
            { icon: ThumbsUp, num: '100%', label: 'Customer Satisfaction' }
          ].map((stat, idx) => (
            <div key={idx} className="footer-stat-item flex items-center gap-1.5">
              <stat.icon className="w-3.5 h-3.5 text-[#ff6b00] shrink-0" />
              <span className="text-gray-900 dark:text-white font-extrabold">{stat.num}</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="text-center md:text-right font-medium text-[10px] text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} <span className="text-[#ff6b00] font-bold">Promech Industries</span>. All rights reserved.
        </div>
      </footer>
    </div>
  );
}


