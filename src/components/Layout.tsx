/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg">
      {/* Mobile Header / Sidebar Logo */}
      <header className="px-6 py-8 md:w-64 md:h-screen md:sticky md:top-0 md:bg-surface md:border-r md:border-border flex md:flex-col justify-between items-center md:items-start transition-all">
        <div className="flex flex-col">
          <h1 className="text-xl serif font-medium tracking-wider text-accent">WEDDING·STREAM</h1>
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-dim mt-1 font-sans">Keepsake System</span>
        </div>
        
        <div className="md:mt-auto md:w-full space-y-4">
          <div className="hidden md:block w-full h-px bg-border" />
          <p className="hidden md:block text-[10px] text-text-dim uppercase tracking-widest px-1">Digital Curator v2.4</p>
        </div>
      </header>

      <main className="flex-grow flex flex-col min-h-screen">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
        
        <footer className="px-6 py-8 text-center text-[10px] uppercase tracking-[0.2em] text-text-dim mt-auto opacity-50">
          © {new Date().getFullYear()} Vows & Views • Elegant Dark Edition
        </footer>
      </main>
    </div>
  );
};
