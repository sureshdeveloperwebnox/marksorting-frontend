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

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f7f8fa] dark:bg-[#0a0a0a]">
      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left Side: Animated Brand Experience (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] h-full relative bg-gradient-to-br from-[#e04a00] via-[#c63400] to-[#3a0600] overflow-hidden p-8 xl:p-12 flex-col justify-between">
          {/* Animated Background Grid & Radial Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.4)_0%,transparent_50%)]" />
          
          {/* Dot Grid overlay representing world map coordinates / high tech */}
          <div 
            className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Dotted World Map Silhouette SVG Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
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

          {/* Top-Left Logo (Flex element in normal document flow) */}
          <div className="z-30 shrink-0 mb-4 select-none mt-4">
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
          
          {/* Left Side Content Container - Dynamic height, scrollable internally if viewport is extremely short */}
          <div className="relative z-10 w-full max-w-md flex-1 min-h-0 flex flex-col justify-center py-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
                  Revolutionizing
                  <span className="block text-[#ff7c30] mt-1">Food Processing.</span>
                </h1>
                <div className="w-16 h-1 bg-[#ff5a00] rounded-full" />
                <p className="text-white/80 text-base xl:text-lg font-medium leading-relaxed max-w-sm pt-2">
                  Promech Industries delivers international standard color sorting solutions to the global market since 2005.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Clean, High-End Floating Form Card Area - Scrollable if it overflows */}
        <div className="flex-1 h-full overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-[430px] bg-white dark:bg-[#111] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-white/5 p-6 sm:p-8 relative z-10 my-auto">
            {/* Header logo, title and subtitle inside the white card */}
            <div className="flex flex-col items-center mb-6">
              {/* Centered logo */}
              <div className="relative w-36 h-12 mb-1.5">
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
              
              <div className="text-center space-y-1.5">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {title}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-xs leading-relaxed max-w-xs">
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
            <div key={idx} className="flex items-center gap-1.5">
              <stat.icon className="w-3.5 h-3.5 text-[#ff6b00] shrink-0" />
              <span className="text-gray-900 dark:text-white font-extrabold">{stat.num}</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="text-center md:text-right font-medium text-[10px] text-gray-400 dark:text-gray-500">
          © 2005-2026 <span className="text-[#ff6b00] font-bold">Promech Industries</span>. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

