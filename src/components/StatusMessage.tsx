
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
  // We're returning null as requested to completely disable the feedback
  // in the middle of the screen
  return null;
};

export default StatusMessage;
