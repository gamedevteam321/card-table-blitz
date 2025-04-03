
import { Button } from "@/components/ui/button";
import { Player } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";
import { Shuffle } from "lucide-react";
import { useRef, useState } from "react";
import { motion } from "framer-motion";

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

  const handleHit = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    // Let the animation play before actually executing the hit logic
    setTimeout(() => {
      onHit();
      setTimeout(() => setIsAnimating(false), 500);
    }, 300);
  };

  return (
    <div className={cn(
      "flex gap-1 sm:gap-2 p-1 sm:p-2 rounded-lg bg-casino-dark/80 border max-w-xs",
      isCurrentPlayer ? "border-casino-accent animate-pulse" : "border-casino-dark",
      orientation === 'vertical' ? "flex-col items-center" : "flex-row items-center",
      isCapturing && "ring ring-yellow-400 shadow-glow"
    )}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-1">
        <div className={cn(
          "w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-white text-xs sm:text-base",
          player.avatarColor
        )}>
          {name[0].toUpperCase()}
        </div>
        <span className="text-xs font-medium truncate max-w-[50px] sm:max-w-full">{name}</span>
        <span className="text-xs text-muted-foreground">{cards.length}</span>
      </div>

      {/* Card stack */}
      <div className="relative" ref={cardRef}>
        <div className="relative">
          {cards.length > 0 && (
            <CardComponent 
              card={topCard} 
              faceDown={true}
              isDealing={isDealing}
              animationType={lastActionType === 'capture' ? 'capture' : 'none'}
              className={cn(
                cards.length > 1 ? "after:content-[''] after:absolute after:top-1 after:left-1 after:w-full after:h-full after:bg-casino-dark after:rounded-md after:-z-10" : "",
                isCapturing && "shadow-glow-card",
                isMobile ? "scale-75" : ""
              )}
            />
          )}
          {isAnimating && cards.length > 0 && (
            <motion.div 
              className="absolute top-0 left-0"
              initial={{ opacity: 1, y: 0, x: 0 }}
              animate={{ 
                opacity: 0, 
                y: positionClass === 'top' ? 120 : positionClass === 'bottom' ? -120 : 0,
                x: positionClass === 'left' ? 120 : positionClass === 'right' ? -120 : 0
              }}
              transition={{ duration: 0.4 }}
            >
              <CardComponent 
                card={topCard} 
                faceDown={false}
                className={isMobile ? "scale-75" : ""}
              />
            </motion.div>
          )}
          {cards.length === 0 && (
            <div className={cn(
              "border border-dashed border-gray-600 rounded-md flex items-center justify-center",
              isMobile ? "w-8 h-12 text-[8px]" : "w-12 h-18 sm:w-16 sm:h-24 text-xs"
            )}>
              <span className="text-gray-400">No cards</span>
            </div>
          )}
          {cards.length > 0 && (
            <div className={cn(
              "absolute -top-2 -right-2 bg-casino-accent text-white font-bold rounded-full flex items-center justify-center",
              isMobile ? "w-4 h-4 text-[8px]" : "w-5 h-5 sm:w-6 sm:h-6 text-xs"
            )}>
              {cards.length}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className={cn(
        "flex gap-1 sm:gap-2",
        orientation === 'vertical' ? "flex-row" : "flex-col"
      )}>
        <Button
          variant="default"
          size={isMobile ? "sm" : "default"}
          disabled={!isCurrentPlayer || cards.length === 0 || status !== 'active' || isAnimating || isDealing}
          onClick={handleHit}
          className={cn(
            "bg-casino-accent hover:bg-casino-accent/90 text-white",
            isMobile ? "text-[10px] px-1 py-0.5 h-6" : "text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2",
            isCurrentPlayer && "animate-pulse"
          )}
        >
          Play
        </Button>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          disabled={!isCurrentPlayer || shufflesRemaining <= 0 || cards.length === 0 || status !== 'active' || isDealing}
          onClick={onShuffle}
          className={cn(
            "border-casino-table",
            isMobile ? "text-[10px] px-1 py-0.5 h-6" : "text-xs sm:text-sm px-1 py-1 sm:px-2 sm:py-1"
          )}
        >
          <Shuffle className={cn(
            isMobile ? "w-2 h-2" : "w-3 h-3 sm:w-4 sm:h-4 mr-1"
          )} />
          {shufflesRemaining}
        </Button>
      </div>

      {/* Turn timer */}
      {isCurrentPlayer && status === 'active' && (
        <div className="w-full mt-1 sm:mt-2">
          <div className="w-full bg-gray-700 h-1 rounded-full">
            <div 
              className="bg-casino-accent h-1 rounded-full transition-all duration-100"
              style={{ width: `${(timeRemaining / 10) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerArea;
