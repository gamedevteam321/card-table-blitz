
import { Player } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PlayerAvatar from "./PlayerAvatar";
import PlayerControls from "./PlayerControls";
import { useScreenSize } from "@/hooks/use-screen-size";

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
  positionClass?: 'top' | 'left' | 'right' | 'bottom' | 'top-left' | 'top-right' | string;
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
  const [hideTopCard, setHideTopCard] = useState(false);
  const { isSmallMobile } = useScreenSize();
  
  // Determine if we should use compact mode
  const useCompactMode = isSmallMobile || 
    (isMobile && (positionClass === 'left' || positionClass === 'right'));
  
  useEffect(() => {
    if (isAnimating && lastActionType === 'throw') {
      setHideTopCard(true);
      const timer = setTimeout(() => {
        setHideTopCard(false);
      }, 700); // Match animation duration in Card component
      return () => clearTimeout(timer);
    }
  }, [isAnimating, lastActionType]);

  const handleHit = () => {
    if (localAnimating || isAnimating || !isCurrentPlayer || cards.length === 0 || status !== 'active' || isDealing) return;
    
    setLocalAnimating(true);
    setHideTopCard(true);
    // Let the animation play before actually executing the hit logic
    setTimeout(() => {
      onHit();
      setTimeout(() => {
        setLocalAnimating(false);
        setHideTopCard(false);
      }, 700); // Match animation duration in Card component
    }, 300);
  };

  // Calculate the color values based on active/inactive state
  const cardBgGradient = isCurrentPlayer 
    ? "bg-gradient-to-b from-indigo-600/95 to-purple-800/95" 
    : "bg-gradient-to-b from-gray-800/90 to-gray-900/90";

  const avatarBg = isCurrentPlayer ? player.avatarColor : `${player.avatarColor.split('-')[0]}-700`;
  const avatarRingColor = isCurrentPlayer ? "ring-yellow-300" : "ring-white";

  // Scale the card for compact mode
  const cardScale = useCompactMode ? "scale-65" : isMobile ? "scale-75" : "";

  return (
    <Card className={cn(
      "transition-all duration-500 ease-in-out border-0 shadow-md overflow-hidden",
      isCurrentPlayer ? "opacity-100" : "opacity-90",
      isCapturing && "ring-2 ring-yellow-400 shadow-lg",
      cardBgGradient,
      useCompactMode ? "p-1" : orientation === 'vertical' ? "p-2" : "p-3",
      isCurrentPlayer ? "shadow-purple-500/20 shadow-lg" : "shadow-gray-900/10",
      useCompactMode ? "max-w-[180px]" : "max-w-[220px]",
    )}>
      <CardContent className={cn(
        useCompactMode ? "p-1" : "p-2",
        "flex gap-1",
        orientation === 'vertical' ? "flex-col items-center" : "flex-row items-center",
      )}>
        <div className={cn(
          "flex flex-col items-center",
          orientation === 'vertical' ? "mb-1" : "mr-2"
        )}>
          <PlayerAvatar 
            name={name}
            avatarBg={avatarBg}
            ringColor={avatarRingColor}
            isCurrentPlayer={isCurrentPlayer}
            isCompact={useCompactMode}
          />
        </div>

        <div className={cn(
          "relative flex-shrink-0 player-card-stack",
        )} ref={cardRef}>
          <div className="relative">
            {cards.length > 1 && (
              <div 
                className={cn(
                  "w-16 h-24 rounded-md card-back",
                  cardScale,
                  "after:content-[''] after:absolute after:top-1 after:left-1 after:w-full after:h-full after:bg-indigo-900 after:rounded-md after:-z-10"
                )}
              />
            )}
            
            {cards.length > 0 ? (
              <div 
                className={cn(
                  "cursor-pointer",
                  cards.length > 1 ? "absolute top-0 left-0" : "relative",
                  (isAnimating && lastActionType === 'throw') || hideTopCard ? "opacity-0 pointer-events-none" : "opacity-100",
                )}
                onClick={handleHit}
                data-player-position={positionClass}
                id={`player-card-${player.id}`}
              >
                <CardComponent 
                  card={topCard} 
                  faceDown={true}
                  isDealing={isDealing}
                  className={cn(
                    isCapturing && "shadow-glow-card",
                    cardScale,
                    isCurrentPlayer && "hover:translate-y-[-5px] transition-transform"
                  )}
                  playerPosition={positionClass as 'top' | 'left' | 'right' | 'bottom' | null}
                />
              </div>
            ) : (
              <div className={cn(
                "border border-dashed rounded-md flex items-center justify-center",
                isCurrentPlayer ? "border-indigo-300" : "border-gray-600",
                useCompactMode ? "w-7 h-10 text-[8px]" : isMobile ? "w-8 h-12 text-[8px]" : "w-12 h-18 sm:w-16 sm:h-24 text-xs",
              )}>
                <span className={isCurrentPlayer ? "text-indigo-200" : "text-gray-500"}>No cards</span>
              </div>
            )}
            
            {isCurrentPlayer && cards.length > 0 && (
              <div className={cn(
                "absolute -top-2 -right-2 bg-amber-500 text-white font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white z-20",
                useCompactMode ? "w-5 h-5 text-[9px]" : "w-6 h-6 text-xs"
              )}>
                {cards.length}
              </div>
            )}
          </div>
        </div>

        <PlayerControls
          isCurrentPlayer={isCurrentPlayer}
          onHit={handleHit}
          onShuffle={onShuffle}
          shufflesRemaining={shufflesRemaining}
          cardsCount={cards.length}
          isDisabled={status !== 'active'}
          isAnimating={localAnimating || isAnimating}
          isDealing={isDealing}
          isCompact={useCompactMode}
        />

        {isCurrentPlayer && status === 'active' && (
          <div className={cn(
            "w-full relative",
            useCompactMode ? "mt-0.5" : "mt-1"
          )}>
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
