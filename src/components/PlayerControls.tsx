
import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerControlsProps {
  isCurrentPlayer: boolean;     // Whether this is the active player
  onHit: () => void;            // Handler for playing a card
  onShuffle: () => void;        // Handler for shuffling cards
  shufflesRemaining: number;    // Number of shuffles the player can still use
  cardsCount: number;           // Number of cards in player's hand
  isDisabled: boolean;          // Whether controls should be disabled
  isAnimating: boolean;         // Whether animation is in progress
  isDealing: boolean;           // Whether cards are being dealt
  isCompact: boolean;           // Whether to use compact layout
}

const PlayerControls = ({
  isCurrentPlayer,
  onHit,
  onShuffle,
  shufflesRemaining,
  cardsCount,
  isDisabled,
  isAnimating,
  isDealing,
  isCompact
}: PlayerControlsProps) => {
  // Render controls for the current player
  if (isCurrentPlayer) {
    return (
      <div className={cn(
        "flex gap-1 w-full justify-center",
        isCompact ? "flex-row" : "flex-row"
      )}>
        {/* Hit button - plays the top card */}
        <Button
          variant="default"
          size={isCompact ? "sm" : "default"}
          disabled={isDisabled || cardsCount === 0 || isAnimating || isDealing}
          onClick={onHit}
          className={cn(
            "btn-play hover:bg-green-600 text-white transition-all shadow-md rounded-md",
            isCompact ? "text-[10px] px-2 py-1 h-6" : "text-xs sm:text-sm px-3 py-1.5",
            isCurrentPlayer && !isDisabled && !isAnimating && "animate-pulse" // Pulsing animation for active player
          )}
        >
          Hit
        </Button>
        
        {/* Shuffle button - shuffles the player's cards */}
        <Button
          variant="outline"
          size={isCompact ? "sm" : "default"}
          disabled={shufflesRemaining <= 0 || isDisabled || cardsCount === 0 || isDealing || isAnimating}
          onClick={onShuffle}
          className={cn(
            "btn-shuffle hover:bg-purple-600 border-none",
            isCompact ? "text-[10px] px-2 py-1 h-6" : "text-xs sm:text-sm px-2 py-1 rounded-md"
          )}
        >
          <RotateCcw className={cn(
            isCompact ? "w-3 h-3 mr-1" : "w-3 h-3 sm:w-4 sm:h-4 mr-1"
          )} />
          {shufflesRemaining}
        </Button>
      </div>
    );
  }
  
  // Render minimal info for other players
  return (
    <div className={cn(
      "text-[10px] text-gray-400 flex items-center justify-center gap-1 mt-1 bg-gray-800/50 px-2 py-0.5 rounded-full",
    )}>
      {/* Show shuffle icon and count if player has shuffles remaining */}
      {shufflesRemaining > 0 && (
        <>
          <RotateCcw className="w-2 h-2" />
          <span>{shufflesRemaining}</span>
        </>
      )}
      <span className="text-gray-300">{cardsCount}c</span> {/* Card count */}
    </div>
  );
};

export default PlayerControls;
