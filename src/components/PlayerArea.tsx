
import { Button } from "@/components/ui/button";
import { Player, Card as CardType } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

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
    ? "bg-gradient-to-b from-indigo-600/95 to-purple-800/95" 
    : "bg-gradient-to-b from-gray-800/90 to-gray-900/90";

  const avatarBg = isCurrentPlayer ? player.avatarColor : `${player.avatarColor.split('-')[0]}-700`;
  const avatarRingColor = isCurrentPlayer ? "ring-yellow-300" : "ring-white";
  
  // Hide the card if it's currently being thrown (animating)
  const hideCard = isAnimating && lastActionType === 'throw' && isCurrentPlayer;

  return (
    <Card className={cn(
      "transition-all duration-500 ease-in-out border-0 shadow-md overflow-hidden",
      isCurrentPlayer ? "scale-105" : "scale-95 opacity-90",
      isCapturing && "ring-2 ring-yellow-400 shadow-lg",
      cardBgGradient,
      orientation === 'vertical' ? "p-2" : "p-3",
      isCurrentPlayer ? "shadow-purple-500/20 shadow-lg" : "shadow-gray-900/10",
      "max-w-[220px]",
      "flex flex-col items-center"
    )}>
      <CardContent className={cn(
        "p-2",
        "flex gap-2",
        "flex-col items-center justify-center",
      )}>
        {/* Avatar Section */}
        <div className="rounded-full flex items-center justify-center font-bold text-white w-12 h-12 sm:w-14 sm:h-14 text-base sm:text-lg ring-2 shadow-inner"
          style={{
            backgroundColor: isCurrentPlayer ? '#4F46E5' : '#6366F1',
            opacity: isCurrentPlayer ? 1 : 0.7
          }}>
          P
        </div>
        
        <div className="text-sm text-center font-medium text-white mt-1">
          {name}
        </div>

        {/* Card stack representation */}
        <div 
          className={cn(
            "relative mt-2 mb-2",
            isCurrentPlayer ? "scale-100" : "scale-90"
          )} 
          ref={cardRef}
          id={`player-card-${player.id}`}
        >
          {cards.length > 0 ? (
            <div className={cn(
              "relative",
              hideCard ? "opacity-0" : "opacity-100"
            )}>
              <CardComponent 
                card={topCard} 
                faceDown={true}
                className={cn(
                  isCapturing && "shadow-glow-card",
                  isMobile ? "scale-75" : "",
                  isCurrentPlayer && "hover:scale-105 transition-transform"
                )}
                playerPosition={positionClass === 'top' ? 'top' : 
                               positionClass === 'left' ? 'left' : 
                               positionClass === 'right' ? 'right' : 'bottom'}
                playerCardElement={`player-card-${player.id}`}
              />
              
              {isCurrentPlayer && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white font-bold rounded-full flex items-center justify-center shadow-md w-6 h-6 text-xs border-2 border-white z-20">
                  {cards.length}
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              "border border-dashed rounded-md flex items-center justify-center",
              isCurrentPlayer ? "border-indigo-300" : "border-gray-600",
              isMobile ? "w-12 h-18 text-[10px]" : "w-16 h-24 text-xs",
            )}>
              <span className={isCurrentPlayer ? "text-indigo-200" : "text-gray-500"}>No cards</span>
            </div>
          )}
        </div>

        {/* Controls - Only show for current player */}
        {isCurrentPlayer && cards.length > 0 && (
          <div className="flex gap-2 mt-1">
            <Button
              variant="default"
              size={isMobile ? "sm" : "default"}
              disabled={!isCurrentPlayer || cards.length === 0 || status !== 'active' || localAnimating || isAnimating || isDealing}
              onClick={handleHit}
              className={cn(
                "bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md",
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
              className="border-amber-400 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {shufflesRemaining}
            </Button>
          </div>
        )}

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
      </CardContent>
    </Card>
  );
};

export default PlayerArea;
