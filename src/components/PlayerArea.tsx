import { Button } from "@/components/ui/button";
import { Player, Card as CardType } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import CardBack from './CardBack';

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer: boolean;
  onHit: () => void;
  onShuffle: () => void;
  timeRemaining: number;
  orientation: 'horizontal' | 'vertical';
  onCardHitDone?: () => void;
  lastActionType?: 'none' | 'hit' | 'capture' | 'throw';
  isDealing?: boolean;
  positionClass?: string;
  isCapturing?: boolean;
  isMobile?: boolean;
  isAnimating?: boolean;
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
  isMobile = false,
  isAnimating = false
}: PlayerAreaProps) => {
  const { name, cards, shufflesRemaining, status } = player;
  const topCard = cards[0];
  const restOfCards = cards.slice(1);
  const cardRef = useRef<HTMLDivElement>(null);
  const [localAnimating, setLocalAnimating] = useState(false);

  const handleHit = () => {
    if (localAnimating || isAnimating || !isCurrentPlayer || cards.length === 0 || status !== 'active' || isDealing) return;
    
    setLocalAnimating(true);
    // Let the animation play before actually executing the hit logic
    setTimeout(() => {
      onHit();
      setTimeout(() => setLocalAnimating(false), 500);
    }, 300);
  };

  // Calculate the color values based on active/inactive state
  const cardBgGradient = isCurrentPlayer 
    ? "bg-transparent" 
    : "bg-transparent";

  const avatarBg = isCurrentPlayer ? player.avatarColor : `${player.avatarColor.split('-')[0]}-700`;
  const avatarRingColor = isCurrentPlayer ? "ring-yellow-300" : "ring-white";

  return (
    <Card className={cn(
      "transition-all duration-500 ease-in-out border-0 shadow-none overflow-hidden select-none",
      isCurrentPlayer ? "" : "opacity-90",
      isCapturing && "ring-2 ring-yellow-400 shadow-lg",
      cardBgGradient,
      orientation === 'vertical' ? "p-2" : "p-3",
      isCurrentPlayer ? "shadow-purple-500/20" : "shadow-gray-900/10",
      "max-w-[220px]" // Added max width to make cards more compact
    )}>
      <CardContent className={cn(
        "p-2 select-none",
        "flex gap-2", // Reduced gap
        orientation === 'vertical' ? "flex-col items-center" : "flex-row items-center",
      )}>
        {/* Avatar Section */}
        <div className={cn(
          "flex flex-col items-center",
          orientation === 'vertical' ? "mb-1" : "mr-2"
        )}>
          <div className={cn(
            "rounded-full flex items-center justify-center font-bold text-white",
            avatarBg,
            "ring-2",
            avatarRingColor,
            "shadow-inner",
            isCurrentPlayer 
              ? "w-8 h-8 text-xs transition-all" 
              : "w-8 h-8 text-xs transition-all"
          )}>
            {name[0].toUpperCase()}
          </div>
          
          <div className="flex flex-col items-center">
            <span className={cn(
              "font-medium truncate mt-1",
              isCurrentPlayer ? "text-sm sm:text-base text-white" : "text-sm sm:text-base text-white"
            )}>
              {name}
            </span>
          </div>
        </div>

        {/* Middle section with card stack */}
        <div className={cn(
          "relative flex-shrink-0 player-card-stack",
          isCurrentPlayer ? "" : "scale-90"
        )} ref={cardRef}>
          <div className="relative">
            {/* Card stack representation (excluding top card) */}
            {cards.length > 1 && (
              <div 
                className={cn(
                  "w-16 h-24",
                  isMobile ? "scale-75" : "",
                  "relative"
                )}
              >
                <CardBack />
              </div>
            )}
            
            {/* Top card - separate entity for animations */}
            {cards.length > 0 ? (
              <div 
                className={cn(
                  "cursor-pointer",
                  cards.length > 1 ? "absolute top-0 left-0" : "relative",
                  isAnimating && lastActionType === 'throw' ? "opacity-0" : "opacity-100"
                )}
                onClick={handleHit}
                data-player-position={positionClass}
                id={`player-card-${player.id}`}
              >
                <CardComponent 
                  card={topCard} 
                  faceDown={true}
                  isDealing={isDealing}
                  animationType={lastActionType === 'throw' ? 'throw' : (lastActionType === 'capture' ? 'capture' : 'none')}
                  className={cn(
                    isCapturing && "shadow-glow-card",
                    isMobile ? "scale-75" : "",
                    isCurrentPlayer && "hover:scale-105 transition-transform",
                    lastActionType === 'throw' && "animate-card-throw"
                  )}
                  playerPosition={positionClass === 'top' ? 'top' : 
                                 positionClass === 'left' ? 'left' : 
                                 positionClass === 'right' ? 'right' : 'bottom'}
                  playerCardElement={`player-card-${player.id}`}
                />
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
            
            {isCurrentPlayer && cards.length > 0 && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#16A34A] text-white font-bold rounded-full flex items-center justify-center shadow-md w-6 h-6 text-xs border-2 border-white z-20">
                {cards.length}
              </div>
            )}
          </div>
        </div>

        {/* Controls - Only show for current player or in compact form for others */}
        {isCurrentPlayer ? (
          <div className={cn(
            "flex gap-2",
            orientation === 'vertical' ? "flex-row" : "flex-col"
          )}>
            <Button
              variant="default"
              size={isMobile ? "sm" : "default"}
              disabled={!isCurrentPlayer || cards.length === 0 || status !== 'active' || localAnimating || isAnimating || isDealing}
              onClick={handleHit}
              className={cn(
                "bg-[#16A34A] hover:bg-[#16A34A]/90 text-white transition-all shadow-md",
                isMobile ? "text-[10px] px-2 py-1 h-7" : "text-xs sm:text-sm px-3 py-1.5",
                isCurrentPlayer && status === 'active' && "animate-pulse"
              )}
            >
              Hit
            </Button>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              disabled={!isCurrentPlayer || shufflesRemaining <= 0 || cards.length === 0 || status !== 'active' || isDealing || isAnimating}
              onClick={onShuffle}
              className={cn(
                "border-amber-400 bg-transparent text-amber-100 hover:bg-transparent",
                isMobile ? "text-[10px] px-2 py-1 h-7" : "text-xs sm:text-sm px-2 py-1"
              )}
            >
              <RotateCcw className={cn(
                isMobile ? "w-3 h-3 mr-1" : "w-3 h-3 sm:w-4 sm:h-4 mr-1"
              )} />
              {shufflesRemaining}
            </Button>
          </div>
        ) : (
          <div className={cn(
            "text-[10px] text-gray-400 flex items-center gap-1 mt-1 bg-transparent px-2 py-0.5 rounded-full",
          )}>
            {shufflesRemaining > 0 && (
              <>
                <RotateCcw className="w-2 h-2" />
                <span>{shufflesRemaining}</span>
              </>
            )}
            <span className="text-gray-300">{cards.length}c</span>
          </div>
        )}

        {/* Turn timer - Only shown for active player */}
        {isCurrentPlayer && status === 'active' && (
          <div className="w-full mt-1 relative">
            <div className="w-full bg-transparent h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-transparent h-1.5 rounded-full transition-all duration-100"
                style={{ width: `${(timeRemaining / 10) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerArea;
