
import { Button } from "@/components/ui/button";
import { Player } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import { useRef, useState } from "react";

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
    if (isAnimating || !isCurrentPlayer || cards.length === 0 || status !== 'active' || isDealing) return;
    
    setIsAnimating(true);
    // Let the animation play before actually executing the hit logic
    setTimeout(() => {
      onHit();
      setTimeout(() => setIsAnimating(false), 500);
    }, 300);
  };

  return (
    <div className={cn(
      "flex flex-col items-center gap-3",
      orientation === 'vertical' ? "p-2" : "p-3",
    )}>
      {/* Avatar Section - New Design */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "rounded-full flex items-center justify-center font-bold text-white",
          isCurrentPlayer ? "ring-4 ring-yellow-400" : "ring-2 ring-white",
          player.avatarColor,
          isCurrentPlayer 
            ? "w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl" 
            : "w-14 h-14 text-xl transition-all"
        )}>
          {name[0].toUpperCase()}
        </div>
        
        <div className="mt-2">
          <span className={cn(
            "font-bold text-white",
            isCurrentPlayer ? "text-lg" : "text-base"
          )}>
            {name}
          </span>
        </div>
      </div>

      {/* Card Stack */}
      <div className={cn(
        "relative flex-shrink-0 mt-1",
        isCurrentPlayer ? "scale-100" : "scale-90"
      )} ref={cardRef}>
        <div className="relative">
          {cards.length > 0 ? (
            <div 
              className="relative cursor-pointer" 
              onClick={handleHit}
            >
              <CardComponent 
                card={topCard} 
                faceDown={true}
                isDealing={isDealing}
                animationType={lastActionType === 'hit' ? 'throw' : (lastActionType === 'capture' ? 'capture' : 'none')}
                className={cn(
                  cards.length > 1 ? "after:content-[''] after:absolute after:top-1 after:left-1 after:w-full after:h-full after:bg-indigo-900 after:rounded-md after:-z-10" : "",
                  isCapturing && "shadow-glow-card",
                  isMobile ? "scale-75" : "",
                  isCurrentPlayer && "hover:scale-105 transition-transform"
                )}
              />
              {isCurrentPlayer && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white font-bold rounded-full flex items-center justify-center shadow-md w-6 h-6 text-xs border-2 border-white">
                  {cards.length}
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              "border border-dashed rounded-md flex items-center justify-center",
              isCurrentPlayer ? "border-indigo-300" : "border-gray-600",
              isMobile ? "w-8 h-12 text-[8px]" : "w-12 h-18 sm:w-16 sm:h-24 text-xs",
            )}>
              <span className={isCurrentPlayer ? "text-indigo-200" : "text-gray-500"}>No cards</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls - Button Section */}
      <div className={cn(
        "flex gap-2 w-full max-w-[220px]",
        orientation === 'vertical' ? "flex-col" : "flex-row"
      )}>
        <Button
          variant="default"
          size="default"
          disabled={!isCurrentPlayer || cards.length === 0 || status !== 'active' || isAnimating || isDealing}
          onClick={handleHit}
          className={cn(
            "bg-green-500 hover:bg-green-600 text-white font-bold flex-grow rounded-md py-2",
            isCurrentPlayer && status === 'active' && !isAnimating ? "shadow-md" : ""
          )}
        >
          Hit
        </Button>
        <Button
          variant="default"
          size="default"
          disabled={!isCurrentPlayer || shufflesRemaining <= 0 || cards.length === 0 || status !== 'active' || isDealing}
          onClick={onShuffle}
          className={cn(
            "bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md py-2 min-w-[80px] flex items-center justify-center",
          )}
        >
          <RotateCcw className="w-4 h-4 mr-1" /> {shufflesRemaining}
        </Button>
      </div>

      {/* Turn timer - Only shown for active player */}
      {isCurrentPlayer && status === 'active' && (
        <div className="w-full mt-1 relative">
          <div className="w-full bg-indigo-900/50 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-300 to-amber-500 h-1.5 rounded-full transition-all duration-100"
              style={{ width: `${(timeRemaining / 10) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerArea;
