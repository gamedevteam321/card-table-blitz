
import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerControlsProps {
  isCurrentPlayer: boolean;
  onHit: () => void;
  onShuffle: () => void;
  shufflesRemaining: number;
  cardsCount: number;
  isDisabled: boolean;
  isAnimating: boolean;
  isDealing: boolean;
  isCompact: boolean;
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
  if (isCurrentPlayer) {
    return (
      <div className={cn(
        "flex gap-1",
        isCompact ? "flex-row" : "flex-col"
      )}>
        <Button
          variant="default"
          size={isCompact ? "sm" : "default"}
          disabled={isDisabled || cardsCount === 0 || isAnimating || isDealing}
          onClick={onHit}
          className={cn(
            "btn-play hover:bg-green-600 text-white transition-all shadow-md rounded-md",
            isCompact ? "text-[10px] px-2 py-1 h-6" : "text-xs sm:text-sm px-3 py-1.5",
            isCurrentPlayer && !isDisabled && !isAnimating && "animate-pulse"
          )}
        >
          Hit
        </Button>
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
  
  return (
    <div className={cn(
      "text-[10px] text-gray-400 flex items-center gap-1 mt-1 bg-gray-800/50 px-2 py-0.5 rounded-full",
    )}>
      {shufflesRemaining > 0 && (
        <>
          <RotateCcw className="w-2 h-2" />
          <span>{shufflesRemaining}</span>
        </>
      )}
      <span className="text-gray-300">{cardsCount}c</span>
    </div>
  );
};

export default PlayerControls;
