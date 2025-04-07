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
    <div className="relative w-full h-64 flex items-center justify-center">
      <div className="absolute inset-0 bg-casino-dark rounded-xl opacity-90 z-0">
        {/* Decorative pattern for the table */}
        <div className="w-full h-full opacity-30" 
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 35%, rgba(76, 29, 149, 0.2) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(29, 78, 216, 0.2) 0%, transparent 60%)',
            backgroundSize: '100% 100%'
          }}>
        </div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center gap-4 w-full">
        {cards.length === 0 && !animatingCard ? (
          <div className="text-gray-400 text-sm">
            Waiting for players...
          </div>
        ) : (
          <>
            <div className="relative h-32 w-24">
              {/* Display the stack of cards */}
              {cards.map((card, index) => {
                // Only show the top two cards with special styling
                if (index >= cards.length - 2) {
                  const isTopCard = index === cards.length - 1;
                  const isSecondCard = index === cards.length - 2;
                  
                  return (
                    <CardComponent 
                      key={card.id} 
                      card={card} 
                      isTable={true} 
                      style={{
                        position: 'absolute',
                        zIndex: isTopCard ? 2 : 1,
                        transform: isSecondCard ? 
                          `translateX(${Math.random() > 0.5 ? -10 : -10}px) rotate(${Math.random() > 0.5 ? -40 : -40}deg)` : 
                          'none',
                        transition: 'transform 0.3s ease-out'
                      }}
                      className={isTopCard ? "shadow-lg" : "opacity-90"}
                    />
                  );
                }
                return null;
              })}
              
              {/* Display the animating card on top with enhanced animation */}
              {animatingCard && (
                <CardComponent 
                  key={animatingCard.id} 
                  card={animatingCard} 
                  isTable={true}
                  animationType="throw"
                  playerPosition={animatingPlayerPosition}
                  className="shadow-lg z-50"
                  playerCardElement={`player-card-${playerPositionToPlayerId(animatingPlayerPosition)}`}
                  style={{
                    position: 'absolute',
                    zIndex: cards.length + 10,
                  }}
                />
              )}
            </div>
            
            {latestCard && (
              <div className="text-casino-gold text-sm font-medium bg-casino-dark/80 px-3 py-1 rounded-full mt-2">
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
