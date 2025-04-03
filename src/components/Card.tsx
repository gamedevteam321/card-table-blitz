
import { Card as CardType } from '../models/game';
import { cn } from '@/lib/utils';

interface CardProps {
  card?: CardType;
  isTable?: boolean;
  className?: string;
  onClick?: () => void;
  isDealing?: boolean;
  dealDelay?: number;
  faceDown?: boolean;
}

const CardComponent = ({ 
  card, 
  isTable = false,
  className,
  onClick,
  isDealing = false,
  dealDelay = 0,
  faceDown = false
}: CardProps) => {
  if (!card) {
    return (
      <div 
        className={cn(
          "w-16 h-24 flex items-center justify-center rounded-md border border-casino-table bg-casino-dark",
          className
        )}
      />
    );
  }

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-white';
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const animationStyle = isDealing ? {
    animation: `deal-card 0.5s ease-out forwards`,
    animationDelay: `${dealDelay}s`
  } : {};

  return (
    <div
      onClick={onClick}
      style={animationStyle}
      className={cn(
        "w-16 h-24 rounded-md border border-gray-500 shadow cursor-pointer transition-transform duration-200",
        isTable ? "card-shadow" : "hover:scale-105",
        isDealing ? "opacity-0" : "",
        faceDown ? "card-back" : "bg-white",
        className
      )}
    >
      {!faceDown && (
        <div className="flex flex-col h-full p-1">
          <div className={cn("text-sm font-bold", getSuitColor(card.suit))}>
            {card.rank}
            <span className="ml-1">{getSuitSymbol(card.suit)}</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className={cn("text-xl", getSuitColor(card.suit))}>
              {getSuitSymbol(card.suit)}
            </span>
          </div>
          <div className={cn("text-sm font-bold self-end rotate-180", getSuitColor(card.suit))}>
            {card.rank}
            <span className="ml-1">{getSuitSymbol(card.suit)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardComponent;
