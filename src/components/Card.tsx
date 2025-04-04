
import { Card as CardType } from '../models/game';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CardProps {
  card?: CardType;
  isTable?: boolean;
  className?: string;
  onClick?: () => void;
  isDealing?: boolean;
  dealDelay?: number;
  faceDown?: boolean;
  style?: React.CSSProperties;
  animationType?: 'deal' | 'hit' | 'capture' | 'throw' | 'none';
  playerPosition?: 'top' | 'left' | 'right' | 'bottom' | null;
  playerCardElement?: string;
}

const CardComponent = ({ 
  card, 
  isTable = false,
  className,
  onClick,
  isDealing = false,
  dealDelay = 0,
  faceDown = false,
  style = {},
  animationType = 'none',
  playerPosition = null,
  playerCardElement
}: CardProps) => {
  if (!card) {
    return (
      <div 
        className={cn(
          "w-16 h-24 flex items-center justify-center rounded-md border border-casino-table bg-casino-dark",
          className
        )}
        style={style}
      />
    );
  }

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black';
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const getRankDisplay = (rank: string) => {
    return rank === '10' ? '10' : rank.charAt(0);
  };

  // Custom throw animation based on player position
  const getThrowAnimation = () => {
    // Get the position of the player's card element if it exists
    let startPosition = { x: 0, y: 0 };
    if (playerCardElement && typeof window !== 'undefined') {
      const element = document.getElementById(playerCardElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Calculate the starting position relative to the center of the screen
        startPosition.x = rect.left + rect.width / 2 - centerX;
        startPosition.y = rect.top + rect.height / 2 - centerY;
      }
    }

    // Adjust the animation based on player position
    switch (playerPosition) {
      case 'bottom':
        return {
          initial: { 
            y: startPosition.y || 150, 
            x: startPosition.x || 0, 
            scale: 0.9, 
            rotate: 0, 
            zIndex: 100,
            opacity: 1
          },
          animate: { 
            y: [startPosition.y || 150, 80, 0], 
            x: [startPosition.x || 0, startPosition.x / 3 || 0, 0], 
            scale: [0.9, 1, 1],
            rotate: [0, -5, 0],
            zIndex: 100,
            opacity: [1, 1, 0],
            transition: { duration: 2, ease: "easeOut" } 
          }
        };
      case 'top':
        return {
          initial: { 
            y: startPosition.y || -150, 
            x: startPosition.x || 0, 
            scale: 0.9, 
            rotate: 0, 
            zIndex: 100,
            opacity: 1
          },
          animate: { 
            y: [startPosition.y || -150, -80, 0], 
            x: [startPosition.x || 0, startPosition.x / 3 || 0, 0], 
            scale: [0.9, 1, 1],
            rotate: [0, 5, 0],
            zIndex: 100,
            opacity: [1, 1, 0],
            transition: { duration: 2, ease: "easeOut" } 
          }
        };
      case 'left':
        return {
          initial: { 
            y: startPosition.y || 0, 
            x: startPosition.x || -150, 
            scale: 0.9, 
            rotate: 0, 
            zIndex: 100,
            opacity: 1
          },
          animate: { 
            y: [startPosition.y || 0, startPosition.y / 2 || 0, 0], 
            x: [startPosition.x || -150, -70, 0], 
            scale: [0.9, 1, 1],
            rotate: [0, 5, 0],
            zIndex: 100,
            opacity: [1, 1, 0],
            transition: { duration: 2, ease: "easeOut" } 
          }
        };
      case 'right':
        return {
          initial: { 
            y: startPosition.y || 0, 
            x: startPosition.x || 150, 
            scale: 0.9, 
            rotate: 0, 
            zIndex: 100,
            opacity: 1
          },
          animate: { 
            y: [startPosition.y || 0, startPosition.y / 2 || 0, 0], 
            x: [startPosition.x || 150, 70, 0], 
            scale: [0.9, 1, 1],
            rotate: [0, -5, 0],
            zIndex: 100,
            opacity: [1, 1, 0],
            transition: { duration: 2, ease: "easeOut" } 
          }
        };
      default:
        return {
          initial: { 
            y: startPosition.y || -50, 
            x: startPosition.x || 0, 
            scale: 0.9, 
            rotate: 0, 
            zIndex: 100,
            opacity: 1
          },
          animate: { 
            y: [startPosition.y || -50, -20, 0], 
            x: [startPosition.x || 0, startPosition.x / 3 || 0, 0], 
            scale: [0.9, 1, 1],
            rotate: [0, -5, 0],
            zIndex: 100,
            opacity: [1, 1, 0],
            transition: { duration: 2, ease: "easeOut" } 
          }
        };
    }
  };

  // Animation variants based on type
  const animationVariants = {
    deal: {
      initial: { opacity: 0, y: -100, rotate: -10, scale: 0.8 },
      animate: { opacity: 1, y: 0, rotate: 0, scale: 1, transition: { duration: 0.8, delay: dealDelay } }
    },
    hit: {
      initial: { y: 0, x: 0, scale: 1, rotate: 0 },
      animate: { 
        y: [-30, 0], 
        x: [0, 80], 
        scale: [0.9, 1],
        rotate: [0, 5, 0],
        transition: { duration: 0.6, ease: "easeOut" } 
      }
    },
    throw: getThrowAnimation(),
    capture: {
      initial: { opacity: 1, scale: 1 },
      animate: { 
        opacity: [1, 0.8, 1], 
        scale: [1, 0.85, 1], 
        x: [0, 20, -80],
        rotate: [0, -5, 0], 
        transition: { duration: 0.5 } 
      }
    },
    none: {
      initial: {},
      animate: {}
    }
  };

  const selectedAnimation = animationVariants[animationType];

  // Use motion.div for animations
  const CardWrapper = animationType !== 'none' || isDealing ? motion.div : 'div';
  
  // Animation props for dealing
  const animationProps = isDealing ? {
    initial: { opacity: 0, y: -100, scale: 0.8, rotate: 180 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      rotate: 0,
      transition: { duration: 0.8, delay: dealDelay * 0.2 }
    }
  } : animationType !== 'none' ? {
    initial: selectedAnimation.initial,
    animate: selectedAnimation.animate
  } : {};

  return (
    <CardWrapper
      onClick={onClick}
      style={{
        ...style,
        zIndex: animationType === 'throw' ? 1000 : (style.zIndex || 'auto')
      }}
      className={cn(
        "w-16 h-24 rounded-md border shadow cursor-pointer transition-transform duration-200",
        isTable ? "card-shadow border-white" : "hover:scale-105 border-gray-300",
        isDealing ? "animate-card-deal" : "",
        faceDown ? "card-back" : "bg-white",
        animationType === 'throw' ? "z-50 table-center" : "",
        className
      )}
      {...animationProps}
    >
      {!faceDown && (
        <div className="flex flex-col h-full p-1">
          <div className={cn("text-sm font-bold", getSuitColor(card.suit))}>
            {getRankDisplay(card.rank)}
            <span className="ml-1">{getSuitSymbol(card.suit)}</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className={cn("text-3xl", getSuitColor(card.suit))}>
              {getSuitSymbol(card.suit)}
            </span>
          </div>
          <div className={cn("text-sm font-bold self-end rotate-180", getSuitColor(card.suit))}>
            {getRankDisplay(card.rank)}
            <span className="ml-1">{getSuitSymbol(card.suit)}</span>
          </div>
        </div>
      )}
    </CardWrapper>
  );
};

export default CardComponent;
