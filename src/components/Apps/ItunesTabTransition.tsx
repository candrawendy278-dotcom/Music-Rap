import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ItunesTabTransitionProps {
  tabKey: string;
  children: React.ReactNode;
}

/**
 * Premium Apple Music-Style View Transition
 * 
 * Provides an ultra-smooth cross-fade animation with a subtle frosted glass blur overlay,
 * mimicking native macOS / iOS Apple Music desktop and mobile app transitions.
 */
export const ItunesTabTransition: React.FC<ItunesTabTransitionProps> = ({
  tabKey,
  children
}) => {
  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tabKey}
          initial={{
            opacity: 0,
            y: 8,
            filter: 'blur(6px)'
          }}
          animate={{
            opacity: 1,
            y: 0,
            filter: 'blur(0px)'
          }}
          exit={{
            opacity: 0,
            y: -6,
            filter: 'blur(6px)'
          }}
          transition={{
            duration: 0.28,
            ease: [0.22, 1, 0.36, 1] // Apple fluid spring curve
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ItunesTabTransition;
