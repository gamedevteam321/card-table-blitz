
import { Player } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PlayerAvatar from "./PlayerAvatar";
import PlayerControls from "./PlayerControls";
import { useScreenSize } from "@/hooks/use-screen-size";

interface PlayerAreaProps {
  player: Player;                          // Player data
  isCurrentPlayer: boolean;                // Whether this is the active player
  onHit: () => void;                       // Handler for playing a card
  onShuffle: () => void;                   // Handler for shuffling cards
  timeRemaining: number;                   // Time remaining for player's turn
  orientation: 'horizontal' | 'vertical';  // Layout orientation
  onCardHitDone?: () => void;              // Callback for when a card hit animation completes
  lastActionType?: 'none' | 'hit' | 'capture' | 'throw'; // Type of last action performed
  isDealing?: boolean;                     // Whether cards are being dealt
  positionClass?: 'top' | 'left' | 'right' | 'bottom' | 'top-left' | 'top-right' | string; // Position relative to table
  isCapturing?: boolean;                   // Whether player is capturing cards
  isMobile?: boolean;                      // Whether we're on a mobile device
  isAnimating?: boolean;                   // Whether animation is in progress
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
  const topCard = cards[0];                          // The top card in player's hand
  const cardRef = useRef<HTMLDivElement>(null);      // Reference to the card element
  const [localAnimating, setLocalAnimating] = useState(false); // Local animation state
  const [hideTopCard, setHideTopCard] = useState(false);       // Whether to hide the top card during animation
  const { isSmallMobile } = useScreenSize();                   // Screen size context
  
  // Determine if we should use compact mode based on screen size and position
  const useCompactMode = isSmallMobile || 
    (isMobile && (positionClass === 'left' || positionClass === 'right'));
  
  // Handle card throwing animation
  useEffect(() => {
    if (isAnimating && lastActionType === 'throw') {
      setHideTopCard(true);
      const timer = setTimeout(() => {
        setHideTopCard(false);
      }, 700); // Match animation duration in Card component
      return () => clearTimeout(timer);
    }
  }, [isAnimating, lastActionType]);

  // Handle card hit action with animation
  const handleHit = () => {
    // Prevent actions during animations or when not allowed
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

  // Determine avatar background and ring colors
  const avatarBg = isCurrentPlayer ? player.avatarColor : `${player.avatarColor.split('-')[0]}-700`;
  const avatarRingColor = isCurrentPlayer ? "ring-yellow-300" : "ring-white";

  // Scale the card for compact mode
  const cardScale = useCompactMode ? "scale-65" : isMobile ? "scale-75" : "";

  return (
    <Card className={cn(
      "transition-all duration-500 ease-in-out border-0 shadow-none overflow-hidden bg-transparent",
      isCurrentPlayer ? "opacity-100" : "opacity-90",
      isCapturing && "ring-2 ring-yellow-400 shadow-lg", // Highlight when capturing
      useCompactMode ? "p-1" : orientation === 'vertical' ? "p-2" : "p-3",
      useCompactMode ? "max-w-[180px]" : "max-w-[220px]",
    )}>
      <CardContent className={cn(
        useCompactMode ? "p-1" : "p-2",
        "flex gap-1",
        orientation === 'vertical' ? "flex-col items-center" : "flex-row items-center",
      )}>
        {/* Player avatar section */}
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

        {/* Player cards section */}
        <div className={cn(
          "relative flex-shrink-0 player-card-stack flex flex-col items-center gap-2",
        )} ref={cardRef}>
          <div className="relative">
            {/* Show card stack if player has more than one card */}
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
              /* Display top card or empty space if animation is in progress */
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
                  playerPosition={positionClass as 'top' | 'left' | 'right' | 'bottom' | 'top-left' | 'top-right' | null}
                />
              </div>
            ) : (
              /* Display empty card slot if player has no cards */
              <div className={cn(
                "border border-dashed rounded-md flex items-center justify-center",
                isCurrentPlayer ? "border-indigo-300" : "border-gray-600",
                useCompactMode ? "w-7 h-10 text-[8px]" : isMobile ? "w-8 h-12 text-[8px]" : "w-12 h-18 sm:w-16 sm:h-24 text-xs",
              )}>
                <span className={isCurrentPlayer ? "text-indigo-200" : "text-gray-500"}>No cards</span>
              </div>
            )}
            
            {/* Card count badge for current player */}
            {isCurrentPlayer && cards.length > 0 && (
              <div className={cn(
                "absolute -top-2 -right-2 bg-amber-500 text-white font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white z-20",
                useCompactMode ? "w-5 h-5 text-[9px]" : "w-6 h-6 text-xs"
              )}>
                {cards.length}
              </div>
            )}
          </div>
          
          {/* Player controls (hit/shuffle buttons) */}
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
        </div>

        {/* Turn timer progress bar for current player */}
        {isCurrentPlayer && status === 'active' && (
          <div className={cn(
            "w-full relative",
            useCompactMode ? "mt-0.5" : "mt-1"
          )}>
            <div className="w-full bg-blue-900/50 h-1.5 rounded-full overflow-hidden">
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
