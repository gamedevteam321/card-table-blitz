
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  if (!isRendered) return null;

  return (
    <div 
      className={cn(
        "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50",
        "px-4 py-2 rounded-lg shadow-lg text-white font-medium",
        "animate-float-message pointer-events-none",
        getTypeStyles()
      )}
    >
      {message}
    </div>
  );
};

export default StatusMessage;
