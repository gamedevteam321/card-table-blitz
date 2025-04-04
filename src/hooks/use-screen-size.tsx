
import { useState, useEffect } from 'react';

// Interface for screen size data
export interface ScreenSizeData {
  width: number;
  height: number;
  screenSize: 'small' | 'medium' | 'large';
  isSmallMobile: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// Custom hook to track and respond to screen size changes
export const useScreenSize = (): ScreenSizeData => {
  // Default state based on assumptions about initial window size
  const [screenSize, setScreenSize] = useState<ScreenSizeData>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    screenSize: 'large',
    isSmallMobile: false,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });
  
  useEffect(() => {
    // Handler to update dimensions on resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine screen size category
      const sizeCategory = width < 640 ? 'small' : width < 1024 ? 'medium' : 'large';
      
      // Determine device type categories
      const isSmallMobile = width < 380;
      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 1024;
      const isDesktop = width >= 1024;
      
      setScreenSize({
        width,
        height,
        screenSize: sizeCategory,
        isSmallMobile,
        isMobile,
        isTablet,
        isDesktop,
      });
    };
    
    // Set up resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      
      // Initial calculation
      handleResize();
      
      // Clean up
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  return screenSize;
};
