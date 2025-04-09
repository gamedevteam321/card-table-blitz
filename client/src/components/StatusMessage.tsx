import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatusMessageProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isVisible: boolean;
  onHide: () => void;
}

const StatusMessage = ({ message, type, isVisible, onHide }: StatusMessageProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      case 'error':
        return 'bg-red-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed left-0 right-0 bottom-0 z-10 flex justify-center items-center pointer-events-none"
          style={{ marginBottom: '1rem' }}
        >
          <div
            className={cn(
              "px-6 py-3 rounded-full shadow-lg text-center font-medium",
              "backdrop-blur-md bg-opacity-90",
              getTypeStyles()
            )}
          >
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusMessage;
