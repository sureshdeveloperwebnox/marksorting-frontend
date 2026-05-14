'use client';

import Lottie from 'lottie-react';
import emptyAnimation from '../../../public/assets/lottiefiles/Empty.json';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({ 
  title = "No data found", 
  description = "There are no records to display at the moment.",
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.6 
        }}
        className="w-48 h-48 md:w-64 md:h-64"
      >
        <Lottie animationData={emptyAnimation} loop={true} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-2 mt-4"
      >
        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
          {title} <span className="text-primary text-3xl leading-none">.</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold max-w-[280px] mx-auto leading-relaxed">
          {description}
        </p>
      </motion.div>
    </div>
  );
}
