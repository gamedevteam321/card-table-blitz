
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

  // Hide the component completely since we don't want the middle screen feedback
  return null;
};

export default StatusMessage;
