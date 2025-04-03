
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

  // Define different styles based on whether this is the current player
  const cardBgColor = isCurrentPlayer 
    ? "bg-gradient-to-b from-purple-500/90 to-purple-700/90" 
    : "bg-gradient-to-b from-casino-dark/90 to-gray-800/80";

  const borderColor = isCurrentPlayer 
    ? "border-purple-400" 
    : "border-gray-700";

  return (
    <div className={cn(
      "flex gap-1 sm:gap-2 p-1 sm:p-2 rounded-lg border transition-all duration-300",
      isCurrentPlayer ? `${borderColor} shadow-lg` : `${borderColor}`,
      orientation === 'vertical' ? "flex-col items-center" : "flex-row items-center",
      isCapturing && "ring ring-yellow-400 shadow-glow",
      isCurrentPlayer ? "scale-105" : "scale-95",
      cardBgColor,
      "backdrop-blur-sm"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex flex-col items-center gap-1",
        isCurrentPlayer ? "w-full" : "w-auto"
      )}>
        <div className={cn(
          "rounded-full flex items-center justify-center font-bold text-white",
          player.avatarColor,
          isCurrentPlayer 
            ? "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-xs sm:text-base" 
            : "w-6 h-6 sm:w-7 sm:h-7 text-xs"
        )}>
          {name[0].toUpperCase()}
        </div>
        <span className={cn(
          "font-medium truncate",
          isCurrentPlayer ? "text-xs sm:text-sm text-white" : "text-xs text-gray-300 max-w-[40px] sm:max-w-[50px]"
        )}>
          {name}
        </span>
        <span className={cn(
          isCurrentPlayer ? "text-xs text-purple-200" : "text-xs text-gray-400"
        )}>
          {cards.length} cards
        </span>
      </div>

      {/* Card stack - Only fully visible for current player */}
      <div className={cn(
        "relative",
        isCurrentPlayer ? "mt-1" : ""
      )} ref={cardRef}>
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
                isCurrentPlayer ? "" : "opacity-90 scale-90",
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
              isMobile ? "w-8 h-12 text-[8px]" : "w-12 h-18 sm:w-16 sm:h-24 text-xs",
              isCurrentPlayer ? "" : "scale-90 opacity-80"
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

      {/* Controls - Only show full controls for current player */}
      {isCurrentPlayer ? (
        <div className={cn(
          "flex gap-1 sm:gap-2 mt-2",
          orientation === 'vertical' ? "flex-row" : "flex-col"
        )}>
          <Button
            variant="default"
            size={isMobile ? "sm" : "default"}
            disabled={!isCurrentPlayer || cards.length === 0 || status !== 'active' || isAnimating || isDealing}
            onClick={handleHit}
            className={cn(
              "bg-purple-600 hover:bg-purple-700 text-white",
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
              "border-purple-300 bg-purple-500/20",
              isMobile ? "text-[10px] px-1 py-0.5 h-6" : "text-xs sm:text-sm px-1 py-1 sm:px-2 sm:py-1"
            )}
          >
            <Shuffle className={cn(
              isMobile ? "w-2 h-2" : "w-3 h-3 sm:w-4 sm:h-4 mr-1"
            )} />
            {shufflesRemaining}
          </Button>
        </div>
      ) : (
        <div className={cn(
          "text-[10px] text-gray-400 mt-1",
          orientation === 'vertical' ? "text-center" : ""
        )}>
          {shufflesRemaining > 0 ? `${shufflesRemaining} shuffles` : ""}
        </div>
      )}

      {/* Turn timer - Only shown for active player */}
      {isCurrentPlayer && status === 'active' && (
        <div className="w-full mt-1 sm:mt-2">
          <div className="w-full bg-purple-900 h-1 rounded-full">
            <div 
              className="bg-purple-400 h-1 rounded-full transition-all duration-100"
              style={{ width: `${(timeRemaining / 10) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerArea;
