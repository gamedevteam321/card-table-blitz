
import * as React from "react";

// Type definitions for toast content
type ToastProps = React.ComponentPropsWithoutRef<typeof import("@/components/ui/toast").Toast>;
type ToastActionElement = React.ReactElement<typeof import("@/components/ui/toast").ToastAction>;

// Interface for toast options
export type ToastOptions = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
};

// Interface for toast state
export type Toast = ToastOptions & {
  id: string;
  open: boolean;
};

// Define the toast context
type ToastContextType = {
  toasts: Toast[];
  addToast: (options: ToastOptions) => void;
  updateToast: (id: string, options: ToastOptions) => void;
  dismissToast: (id: string) => void;
  removeToast: (id: string) => void;
};

// Create context with default values
const ToastContext = React.createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  updateToast: () => {},
  dismissToast: () => {},
  removeToast: () => {},
});

// Hook to generate unique IDs for toasts
const useToastId = () => {
  return React.useId();
};

/**
 * Provider component for the toast system
 * Manages toast state and provides methods to create/update/dismiss toasts
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  // Add a new toast
  const addToast = React.useCallback((options: ToastOptions) => {
    const id = useToastId();
    
    setToasts((prev) => [
      ...prev,
      { id, open: true, ...options },
    ]);
    
    return id;
  }, []);

  // Update an existing toast by ID
  const updateToast = React.useCallback((id: string, options: ToastOptions) => {
    setToasts((prev) => 
      prev.map((toast) => 
        toast.id === id ? { ...toast, ...options } : toast
      )
    );
  }, []);

  // Mark a toast as dismissed (closed)
  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => 
      prev.map((toast) => 
        toast.id === id ? { ...toast, open: false } : toast
      )
    );
  }, []);

  // Remove a toast completely from the state
  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Context value with all toast functionality
  const value = React.useMemo(
    () => ({
      toasts,
      addToast,
      updateToast,
      dismissToast,
      removeToast,
    }),
    [toasts, addToast, updateToast, dismissToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

/**
 * Custom hook to access toast functionality
 * Provides a simplified toast method for common usage
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  // Simplified toast function with default parameters
  const toast = React.useCallback(
    ({ title, description, variant, ...props }: ToastOptions) => {
      return context.addToast({ title, description, variant, ...props });
    },
    [context]
  );

  return {
    toast,
    toasts: context.toasts,
    dismiss: context.dismissToast,
    update: context.updateToast,
    remove: context.removeToast,
  };
}
