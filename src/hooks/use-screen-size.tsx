
import * as React from "react"

// Define breakpoints
export const SCREEN_SIZES = {
  SMALL: 480,    // Mobile phones
  MEDIUM: 768,   // Tablets/small screens
  LARGE: 1024,   // Laptops/desktops
  XLARGE: 1280   // Large desktops
}

export type ScreenSize = 'small' | 'medium' | 'large' | 'xlarge';

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<ScreenSize>('large');
  const [width, setWidth] = React.useState<number>(0);

  React.useEffect(() => {
    // Handle initial detection
    const checkScreenSize = () => {
      const currentWidth = window.innerWidth;
      setWidth(currentWidth);
      
      if (currentWidth < SCREEN_SIZES.SMALL) {
        setScreenSize('small');
      } else if (currentWidth < SCREEN_SIZES.MEDIUM) {
        setScreenSize('medium');
      } else if (currentWidth < SCREEN_SIZES.LARGE) {
        setScreenSize('large');
      } else {
        setScreenSize('xlarge');
      }
    }
    
    // Check immediately for first render
    checkScreenSize();
    
    // Set up event listener for resize
    window.addEventListener("resize", checkScreenSize);
    
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const isMobile = screenSize === 'small' || screenSize === 'medium';
  const isSmallMobile = screenSize === 'small';
  const isMediumScreen = screenSize === 'medium';
  const isLargeScreen = screenSize === 'large' || screenSize === 'xlarge';
  
  return { 
    screenSize, 
    isMobile, 
    isSmallMobile, 
    isMediumScreen, 
    isLargeScreen,
    width
  };
}
