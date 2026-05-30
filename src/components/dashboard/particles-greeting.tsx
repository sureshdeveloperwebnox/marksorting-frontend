'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';

// Global styles for particles canvas
const particlesStyles = `
  .particles-greeting-container canvas {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 0 !important;
  }
`;

interface ParticlesGreetingProps {
  className?: string;
}

declare global {
  interface Window {
    __particlesCursor?: {
      uniforms: {
        uColor: { value: { set: (c: number) => void } };
        uCoordScale: { value: number };
        uNoiseIntensity: { value: number };
        uPointSize: { value: number };
      };
      destroy: () => void;
    };
    __initParticlesCursor?: (el: HTMLDivElement | null) => typeof window.__particlesCursor;
  }
}

function useGreeting(): string {
  const [greeting, setGreeting] = React.useState('Hello');

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  return greeting;
}

function ParticlesCursor({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Load threejs-toys via script tag
    const scriptId = 'threejs-toys-cursor';
    
    if (window.__initParticlesCursor) {
      initParticles();
      return;
    }

    // Load the module script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'module';
    script.textContent = `
      import { particlesCursor } from 'https://unpkg.com/threejs-toys@0.0.8/build/threejs-toys.module.cdn.min.js';
      
      window.__initParticlesCursor = function(el) {
        if (window.__particlesCursor) {
          window.__particlesCursor.destroy();
          window.__particlesCursor = undefined;
        }
        
        const pc = particlesCursor({
          el: el,
          gpgpuSize: 256,
          colors: [0xff6600, 0xff8800],
          color: 0xff6600,
          coordScale: 0.5,
          noiseIntensity: 0.001,
          noiseTimeCoef: 0.0001,
          pointSize: 4,
          pointDecay: 0.0025,
          sleepRadiusX: 150,
          sleepRadiusY: 150,
          sleepTimeCoefX: 0.001,
          sleepTimeCoefY: 0.002
        });
        
        window.__particlesCursor = pc;
        return pc;
      };
      
      // Dispatch event when ready
      window.dispatchEvent(new Event('particlesCursorReady'));
    `;
    document.head.appendChild(script);
    
    // Listen for the ready event
    const handleReady = () => {
      initParticles();
      window.removeEventListener('particlesCursorReady', handleReady);
    };
    window.addEventListener('particlesCursorReady', handleReady);

    function initParticles() {
      if (window.__initParticlesCursor && container) {
        try {
          window.__initParticlesCursor(container);
          setIsLoaded(true);
          console.log('[ParticlesCursor] Initialized successfully');
        } catch (error) {
          console.error('[ParticlesCursor] Failed to initialize:', error);
        }
      } else {
        console.log('[ParticlesCursor] Not ready yet, __initParticlesCursor:', !!window.__initParticlesCursor, 'container:', !!container);
      }
    }

    return () => {
      if (window.__particlesCursor) {
        window.__particlesCursor.destroy();
        window.__particlesCursor = undefined;
      }
    };
  }, [containerRef]);

  const handleClick = () => {
    if (window.__particlesCursor) {
      const randomColor = Math.random() * 0xffffff;
      window.__particlesCursor.uniforms.uColor.value.set(randomColor);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`absolute inset-0 cursor-pointer ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      style={{ zIndex: 1 }}
    />
  );
}

export function ParticlesGreeting({ className }: ParticlesGreetingProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const greeting = useGreeting();

  const name = user?.full_name || 'User';

  return (
    <>
      <style>{particlesStyles}</style>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`
          particles-greeting-container
          relative overflow-hidden rounded-2xl 
          bg-gradient-to-br from-primary via-[oklch(0.64_0.21_44/80%)] to-[oklch(0.64_0.21_44/60%)]
          dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-950
          px-7 py-6 shadow-lg border border-white/20 dark:border-zinc-700
          min-h-[120px] select-none
          ${className}
        `}
      >
      {/* Particles Cursor Layer */}
      <ParticlesCursor containerRef={containerRef} />

      {/* Text Content */}
      <div className="relative z-10 flex flex-col justify-center h-full pointer-events-none">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md"
        >
          {greeting.toUpperCase()}, {name.toUpperCase()}!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm text-white/80 font-medium mt-2 leading-snug drop-shadow-sm"
        >
          Here&apos;s what&apos;s happening with your business today.
        </motion.p>
      </div>
      </motion.div>
    </>
  );
}
