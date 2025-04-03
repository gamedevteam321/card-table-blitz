
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
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setOpacity(0.7);
      const timer = setTimeout(() => {
        setOpacity(0);
        setTimeout(onHide, 300);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  const bgColor = type === 'success' 
    ? 'bg-green-500' 
    : type === 'warning' 
    ? 'bg-amber-500' 
    : type === 'error' 
    ? 'bg-red-500' 
    : 'bg-blue-500';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className={cn(
              "p-4 text-white text-center font-medium rounded-b-md shadow-lg w-auto max-w-xs",
              bgColor
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
