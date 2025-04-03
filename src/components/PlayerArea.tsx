
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
  isCapturing = false
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
      "flex gap-2 p-2 sm:gap-3 sm:p-3 rounded-lg bg-casino-dark/80 border max-w-xs",
      isCurrentPlayer ? "border-casino-accent animate-pulse" : "border-casino-dark",
      orientation === 'vertical' ? "flex-col items-center" : "flex-row items-center",
      isCapturing && "ring ring-yellow-400 shadow-glow"
    )}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-1">
        <div className={cn(
          "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white",
          player.avatarColor
        )}>
          {name[0].toUpperCase()}
        </div>
        <span className="text-xs sm:text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{cards.length} cards</span>
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
                isCapturing && "shadow-glow-card"
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
              />
            </motion.div>
          )}
          {cards.length === 0 && (
            <div className="w-12 h-18 sm:w-16 sm:h-24 border border-dashed border-gray-600 rounded-md flex items-center justify-center">
              <span className="text-xs text-gray-400">No cards</span>
            </div>
          )}
          {cards.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-casino-accent text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
              {cards.length}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className={cn(
        "flex gap-2",
        orientation === 'vertical' ? "flex-row" : "flex-col"
      )}>
        <Button
          variant="default"
          size="sm"
          disabled={!isCurrentPlayer || cards.length === 0 || status !== 'active' || isAnimating || isDealing}
          onClick={handleHit}
          className={cn(
            "bg-casino-accent hover:bg-casino-accent/90 text-white text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2",
            isCurrentPlayer && "animate-pulse"
          )}
        >
          Play
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!isCurrentPlayer || shufflesRemaining <= 0 || cards.length === 0 || status !== 'active' || isDealing}
          onClick={onShuffle}
          className="border-casino-table text-xs sm:text-sm px-1 py-1 sm:px-2 sm:py-1"
        >
          <Shuffle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          {shufflesRemaining}
        </Button>
      </div>

      {/* Turn timer */}
      {isCurrentPlayer && status === 'active' && (
        <div className="w-full mt-2">
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
