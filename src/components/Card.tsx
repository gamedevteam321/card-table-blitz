import { Card as CardType } from '../models/game';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';

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
  // Spring animation for hover effect
  const [springProps, setSpringProps] = useSpring(() => ({
    scale: 1,
    y: 0,
    config: { tension: 300, friction: 10 }
  }));

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

  // Enhanced throw animation using Framer Motion
  const getThrowAnimation = () => {
    let startPosition = { x: 0, y: 0 };
    if (playerCardElement && typeof window !== 'undefined') {
      const element = document.getElementById(playerCardElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        startPosition.x = rect.left + rect.width / 2 - centerX;
        startPosition.y = rect.top + rect.height / 2 - centerY;
      }
    }

    const commonProps = {
      zIndex: 50,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    };

    // Enhanced throw animation with Framer Motion
    const getThrowPath = (startX: number, startY: number) => {
      return {
        initial: { 
          y: startY, 
          x: startX, 
          scale: 1, 
          rotate: 0,
          opacity: 0,
          ...commonProps
        },
        animate: { 
          y: [startY, 0],
          x: [startX, 0],
          scale: [1, 1],
          rotate: [0, 0],
          opacity: [0, 1],
       
        },
        exit: {
          opacity: 0,
          scale: 0.8,
        
        }
      };
    };

    switch (playerPosition) {
      case 'bottom':
        return getThrowPath(
          startPosition.x || 0,
          startPosition.y || 200
        );
      case 'top':
        return getThrowPath(
          startPosition.x || 0,
          startPosition.y || -200
        );
      case 'left':
        return getThrowPath(
          startPosition.x || -200,
          startPosition.y || 0
        );
      case 'right':
        return getThrowPath(
          startPosition.x || 200,
          startPosition.y || 0
        );
      default:
        return getThrowPath(
          startPosition.x || 0,
          startPosition.y || -100
        );
    }
  };

  // Animation variants using Framer Motion
  const animationVariants = {
    deal: {
      initial: { opacity: 0, y: -100, rotate: -10, scale: 0.8 },
      animate: { 
        opacity: 1, 
        y: 0, 
        rotate: 0, 
        scale: 1, 
       
      }
    },
    hit: {
      initial: { y: 0, x: 0, scale: 1, rotate: 0 },
      animate: { 
        y: [-30, 0], 
        x: [0, 80], 
        scale: [0.9, 1],
        rotate: [0, 5, 0],
       
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
       
      }
    },
    none: {
      initial: {},
      animate: {}
    }
  };

  const selectedAnimation = animationVariants[animationType];

  return (
    <AnimatePresence>
      <motion.div
        onClick={onClick}
        style={style}
        className={cn(
          "w-16 h-24 rounded-md border shadow cursor-pointer transition-transform duration-200",
          isTable ? "card-shadow border-white" : "hover:scale-105 border-gray-300",
          isDealing ? "animate-card-deal" : "",
          faceDown ? "card-back" : "bg-white",
          className
        )}
        initial={selectedAnimation.initial}
        animate={selectedAnimation.animate}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0, ease: "easeOut" } }}
        whileHover={{ 
          scale: 1.05,
          transition: { duration: 0, ease: "easeOut" }
        }}
        whileTap={{ 
          scale: 0.95,
          transition: { duration: 0, ease: "easeOut" }
        }}
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
      </motion.div>
    </AnimatePresence>
  );
};

export default CardComponent;
