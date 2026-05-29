'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LogoProps {
  className?: string;
  isCollapsed?: boolean;
}

export function Logo({ className, isCollapsed = false }: LogoProps) {
  return (
    <div className={cn('flex items-center justify-center w-full', className)}>
      <motion.div
        layout
        initial={false}
        animate={{
          width: isCollapsed ? 48 : '100%',
          height: isCollapsed ? 48 : 96,
          borderRadius: isCollapsed ? 16 : 24,
          padding: isCollapsed ? 8 : 16,
        }}
        transition={{
          type: 'tween',
          ease: [0.16, 1, 0.3, 1],
          duration: 0.22,
        }}
        className="bg-white shadow-xl flex items-center justify-center overflow-hidden w-full max-w-[210px] relative"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isCollapsed ? (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: 'tween',
                ease: [0.16, 1, 0.3, 1],
                duration: 0.22,
              }}
              className="w-full h-full relative"
            >
              <Image
                src="/assets/favicon.png"
                alt="Mark Sorter Logo"
                fill
                className="object-contain filter drop-shadow-sm"
                priority
              />
            </motion.div>
          ) : (
            <motion.div
              key="expanded-logo"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: 'tween',
                ease: [0.16, 1, 0.3, 1],
                duration: 0.22,
              }}
              className="w-full h-full relative"
            >
              <Image
                src="/assets/logo.png"
                alt="Mark Sorting System"
                fill
                className="object-contain filter drop-shadow-sm"
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
