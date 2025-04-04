
import { Button } from "@/components/ui/button";
import { Player } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer: boolean;
  onHit: () => void;
  onShuffle: () => void;
  timeRemaining: number;
  orientation: 'horizontal' | 'vertical';
  onCardHitDone?: () => void;
  lastActionType?: 'none' | 'hit' | 'capture';
  isDealing?: boolean;
  positionClass?: string;
  isCapturing?: boolean;
  isMobile?: boolean;
}

const PlayerArea = ({
  player,
  isCurrentPlayer,
  onHit,
  onShuffle,
  timeRemaining,
  orientation,
  onCardHitDone,
  lastActionType = 'none',
  isDealing = false,
  positionClass = '',
  isCapturing = false,
  isMobile = false
}: PlayerAreaProps) => {
  const { name, cards, shufflesRemaining, status } = player;
  const topCard = cards[0];
  const cardRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCardThrowing, setIsCardThrowing] = useState(false);

  const handleHit = () => {
    if (isAnimating || !isCurrentPlayer || cards.length === 0 || status !== 'active' || isDealing) return;
    
    setIsAnimating(true);
    setIsCardThrowing(true);
    
    // Let the animation play before actually executing the hit logic
    setTimeout(() => {
      // Reset card throwing state after animation completes
      setIsCardThrowing(false);
      onHit();
      setTimeout(() => setIsAnimating(false), 500);
    }, 600); // Increased timeout to allow for card throwing animation
  };

  // Avatar border color based on active/inactive state
  const avatarBorderClass = isCurrentPlayer ? "ring-4 ring-yellow-400" : "ring-4 ring-white";
  
  // Calculate the position for the throwing card based on orientation
  const throwingCardClass = () => {
    if (!isCurrentPlayer || !isCardThrowing) return "";
    
    switch(positionClass) {
      case 'bottom':
        return 'animate-card-throw-bottom';
      case 'top':
        return 'animate-card-throw-top';
      case 'left':
        return 'animate-card-throw-left';
      case 'right':
        return 'animate-card-throw-right';
      default:
        return 'animate-card-throw-bottom';
    }
  };

  return (
    <div className={cn(
      "transition-all duration-300 w-full max-w-[260px] min-w-[200px]",
      orientation === 'vertical' ? "flex flex-col items-center" : "flex flex-row items-center justify-between",
      isCurrentPlayer ? "z-20" : "opacity-90 z-10",
    )}>
      {/* Left side with avatar and name */}
      <div className={cn(
        "flex flex-col items-center",
        orientation === 'vertical' ? "mb-3" : "mr-4"
      )}>
        <div className={cn(
          "rounded-full flex items-center justify-center text-white font-bold bg-red-500",
          avatarBorderClass,
          "shadow-lg",
          isCurrentPlayer 
            ? "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl" 
            : "w-12 h-12 sm:w-16 sm:h-16 text-lg sm:text-xl"
        )}>
          {name[0].toUpperCase()}
        </div>
        
        <span className={cn(
          "font-medium text-white mt-2 text-center",
          isCurrentPlayer ? "text-base sm:text-lg" : "text-sm"
        )}>
          {name}
        </span>
      </div>

      {/* Right side with cards and controls */}
      <div className={cn(
        "flex",
        orientation === 'vertical' ? "flex-col items-center" : "flex-col items-end"
      )}>
        {/* Card stack */}
        <div className="relative mb-3" ref={cardRef}>
          {cards.length > 0 ? (
            <div 
              className={cn(
                "relative cursor-pointer transform transition-transform",
                isCurrentPlayer && "hover:scale-105"
              )} 
              onClick={handleHit}
            >
              {/* Card stack effect - showing multiple cards */}
              <div className="relative">
                {/* Back cards for stack effect */}
                {cards.length > 2 && (
                  <div className="absolute -right-3 -bottom-3 w-16 h-24 sm:w-20 sm:h-28 rounded-md card-back transform rotate-3"></div>
                )}
                {cards.length > 1 && (
                  <div className="absolute -right-1.5 -bottom-1.5 w-16 h-24 sm:w-20 sm:h-28 rounded-md card-back transform rotate-1.5"></div>
                )}
                
                {/* Main visible card */}
                <CardComponent 
                  card={topCard} 
                  faceDown={true}
                  isDealing={isDealing}
                  animationType={lastActionType === 'capture' ? 'capture' : 'none'}
                  className={cn(
                    "w-16 h-24 sm:w-20 sm:h-28",
                    isCapturing && "shadow-glow-card"
                  )}
                />
                
                {/* Card count badge */}
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white font-medium rounded-full flex items-center justify-center shadow-md w-6 h-6 text-xs border-2 border-white">
                  {cards.length}
                </div>
              </div>
              
              {/* Throwing card animation */}
              {isCardThrowing && (
                <div className={cn(
                  "absolute w-16 h-24 sm:w-20 sm:h-28 card-back rounded-md z-30",
                  throwingCardClass()
                )}></div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-gray-400 rounded-md flex items-center justify-center w-16 h-24 sm:w-20 sm:h-28 text-gray-400">
              No cards
            </div>
          )}
        </div>

        {/* Controls */}
        <div className={cn(
          "flex gap-2",
          orientation === 'vertical' ? "flex-row" : "flex-row"
        )}>
          <Button
            variant="default"
            size={isMobile ? "sm" : "default"}
            disabled={!isCurrentPlayer || cards.length === 0 || status !== 'active' || isAnimating || isDealing}
            onClick={handleHit}
            className={cn(
              "bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-md px-8",
              isMobile ? "text-xs py-2" : "text-sm py-3 px-10",
              isCurrentPlayer && status === 'active' && "animate-pulse"
            )}
          >
            Play
          </Button>
          <Button
            variant="default"
            size={isMobile ? "sm" : "default"}
            disabled={!isCurrentPlayer || shufflesRemaining <= 0 || cards.length === 0 || status !== 'active' || isDealing}
            onClick={onShuffle}
            className={cn(
              "bg-blue-600 hover:bg-blue-700 text-white font-bold",
              isMobile ? "text-xs" : "text-sm"
            )}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            {shufflesRemaining}
          </Button>
        </div>
        
        {/* Turn timer - Only shown for active player */}
        {isCurrentPlayer && status === 'active' && (
          <div className="w-full mt-3 relative">
            <div className="w-full bg-gray-800/50 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-300 to-amber-500 h-1.5 rounded-full transition-all duration-100"
                style={{ width: `${(timeRemaining / 10) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerArea;
