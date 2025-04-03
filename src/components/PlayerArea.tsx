
import { Button } from "@/components/ui/button";
import { Player } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";
import { Shuffle } from "lucide-react";

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer: boolean;
  onHit: () => void;
  onShuffle: () => void;
  timeRemaining: number;
  orientation: 'horizontal' | 'vertical';
}

const PlayerArea = ({
  player,
  isCurrentPlayer,
  onHit,
  onShuffle,
  timeRemaining,
  orientation
}: PlayerAreaProps) => {
  const { name, cards, shufflesRemaining, status } = player;
  const topCard = cards[0];

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg bg-casino-dark border",
      isCurrentPlayer ? "border-casino-accent animate-pulse" : "border-casino-dark",
      orientation === 'vertical' ? "flex-col" : "flex-row"
    )}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-1">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center font-bold text-white",
          player.avatarColor
        )}>
          {name[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{cards.length} cards</span>
      </div>

      {/* Card stack */}
      <div className="relative">
        <div className="relative">
          {cards.length > 0 && (
            <CardComponent card={topCard} faceDown={true} />
          )}
          {cards.length === 0 && (
            <div className="w-16 h-24 border border-dashed border-gray-600 rounded-md flex items-center justify-center">
              <span className="text-xs text-gray-400">No cards</span>
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
          disabled={!isCurrentPlayer || cards.length === 0 || status !== 'active'}
          onClick={onHit}
          className={cn(
            "bg-casino-accent hover:bg-casino-accent/90 text-white",
            isCurrentPlayer && "animate-pulse"
          )}
        >
          Hit
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!isCurrentPlayer || shufflesRemaining <= 0 || cards.length === 0 || status !== 'active'}
          onClick={onShuffle}
          className="border-casino-table"
        >
          <Shuffle className="w-4 h-4 mr-1" />
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
