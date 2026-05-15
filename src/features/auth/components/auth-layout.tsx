'use client';

import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/logo';
import { ShieldCheck, Zap, Activity } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0a0a0a] overflow-hidden">
      {/* Left Side: Animated Brand Experience (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center p-12">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.1)_0%,transparent_50%)]" />
        
        {/* Floating Particles Animation */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.2, 0.5, 0.2], 
              scale: [1, 1.2, 1],
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0]
            }}
            transition={{ 
              duration: 5 + Math.random() * 5, 
              repeat: Infinity,
              delay: i * 0.2
            }}
            className="absolute w-2 h-2 bg-white rounded-full blur-[2px]"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%` 
            }}
          />
        ))}

        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-[40px] border border-white/20 shadow-2xl">
              <h1 className="text-5xl font-black text-white leading-tight mb-4 italic tracking-tighter">
                Revolutionizing <br />
                <span className="text-white/60 not-italic text-4xl">Food Processing.</span>
              </h1>
              <p className="text-white/80 text-lg font-medium leading-relaxed">
                Promech Industries: Delivering international standard color sorters to the global market since 2005.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: Zap, label: 'Global Leadership', desc: 'Leading the demand for high-standard color sorters' },
                { icon: ShieldCheck, label: 'Quality Excellence', desc: 'Optimum quality control for superior finishes' },
                { icon: Activity, label: 'Latest Innovation', desc: 'Cutting-edge technology for industrial potential' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{item.label}</h3>
                    <p className="text-white/50 text-xs">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Clean, High-End Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex flex-col items-center lg:items-start"
          >
            <Logo className="mb-8 lg:-ml-6 lg:scale-125" />
            <div className="text-center lg:text-left space-y-2">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h2>
              <p className="text-gray-500 font-bold text-lg">{subtitle}</p>
            </div>
          </motion.div>

          {children}
        </div>

        {/* Responsive Branding for Mobile */}
        <div className="lg:hidden absolute bottom-8 text-center w-full px-8">
          <p className="text-xs text-gray-400 font-black uppercase tracking-[0.2em]">
            &copy; 2024 Mark Sorting System
          </p>
        </div>
      </div>
    </div>
  );
}
