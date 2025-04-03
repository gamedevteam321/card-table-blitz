
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StatusMessageProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isVisible: boolean;
  onHide: () => void;
}

const StatusMessage = ({ message, type, isVisible, onHide }: StatusMessageProps) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
      const timer = setTimeout(() => {
        onHide();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/90 border-green-600';
      case 'warning':
        return 'bg-yellow-500/90 border-yellow-600';
      case 'error':
        return 'bg-red-500/90 border-red-600';
      case 'info':
      default:
        return 'bg-blue-500/90 border-blue-600';
    }
  };

  if (!isRendered) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className={cn(
            "fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50",
            "px-4 py-2 rounded-md shadow-lg text-white font-medium",
            "backdrop-blur-sm border",
            "pointer-events-none",
            getTypeStyles()
          )}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusMessage;
