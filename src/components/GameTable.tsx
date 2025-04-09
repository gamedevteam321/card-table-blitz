import { useState, useEffect } from "react";
import { Card, getCardValue } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface GameTableProps {
  cards: Card[];
  animatingCard: Card | null;
  animatingPlayerPosition?: 'top' | 'left' | 'right' | 'bottom' | null;
}

const GameTable = ({ cards, animatingCard, animatingPlayerPosition = null }: GameTableProps) => {
  const isMobile = useIsMobile();
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  
  // Helper function to get the full name of a card
  const getCardName = (card: Card) => {
    const rankNames: Record<string, string> = {
      'A': 'Ace', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five',
      '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten',
      'J': 'Jack', 'Q': 'Queen', 'K': 'King'
    };
    
    const suitNames: Record<string, string> = {
      'hearts': 'Hearts', 'diamonds': 'Diamonds', 
      'clubs': 'Clubs', 'spades': 'Spades'
    };
    
    return `${rankNames[card.rank]} of ${suitNames[card.suit]}`;
  };

  // Get the latest card to display
  const latestCard = animatingCard || (cards.length > 0 ? cards[cards.length - 1] : null);

  return (
    <div className="relative w-full h-full bg-casino-table rounded-xl shadow-2xl p-4">
      <div className="relative z-10 flex flex-col items-center justify-center gap-4 sm:gap-6 w-full">
        {cards.length === 0 && !animatingCard ? (
          <div className="text-casino-gold text-sm sm:text-lg font-medium bg-casino-dark/90 px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
            Waiting for players...
          </div>
        ) : (
          <>
            <div className={cn(
              "relative",
              isMobile ? "h-20 w-14" : "h-32 w-24"
            )}>
              {/* Display the stack of cards with enhanced styling */}
              {cards.map((card, index) => {
                // Only show the top three cards with special styling
                if (index >= cards.length - 3) {
                  const isTopCard = index === cards.length - 1;
                  const isSecondCard = index === cards.length - 2;
                  const isThirdCard = index === cards.length - 3;
                  
                  return (
                    <CardComponent 
                      key={card.id} 
                      card={card} 
                      isTable={true} 
                      style={{
                        position: 'absolute',
                        zIndex: isTopCard ? 3 : (isSecondCard ? 2 : 1),
                        transform: isSecondCard ? 
                          `translateX(${Math.random() > 0.5 ? -5 : 5}px) rotate(${Math.random() > 0.5 ? -2 : 2}deg)` : 
                          isThirdCard ?
                          `translateX(${Math.random() > 0.5 ? -10 : 10}px) rotate(${Math.random() > 0.5 ? -4 : 4}deg)` :
                          'none',
                        transition: 'all 0.3s ease-out'
                      }}
                      className={cn(
                        isTopCard ? "shadow-xl" : (isSecondCard ? "opacity-90" : "opacity-80"),
                        "hover:scale-110 hover:rotate-2 transition-all duration-300"
                      )}
                    />
                  );
                }
                return null;
              })}
              
              {animatingCard && (
                <CardComponent 
                  key={animatingCard.id} 
                  card={animatingCard} 
                  isTable={true}
                  animationType="throw"
                  playerPosition={animatingPlayerPosition}
                  className="shadow-xl z-50"
                  playerCardElement={`player-card-${playerPositionToPlayerId(animatingPlayerPosition)}`}
                  style={{
                    position: 'absolute',
                    zIndex: cards.length + 10,
                  }}
                />
              )}
            </div>
            
            {latestCard && (
              <div className="text-casino-gold text-sm sm:text-lg font-medium bg-casino-dark/90 px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-xl backdrop-blur-sm animate-pulse">
                {getCardName(latestCard)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to convert position to player ID format
const playerPositionToPlayerId = (position: 'top' | 'left' | 'right' | 'bottom' | null): string => {
  switch (position) {
    case 'bottom': return 'player-0';
    case 'left': return 'player-1';
    case 'top': return 'player-2';
    case 'right': return 'player-3';
    default: return '';
  }
};

export default GameTable;
