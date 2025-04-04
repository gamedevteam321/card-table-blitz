
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
  const [displayedCard, setDisplayedCard] = useState<Card | null>(null);
  const [showAnimatedCard, setShowAnimatedCard] = useState(true);
  
  // When animation completes, show the card in the deck
  useEffect(() => {
    if (animatingCard) {
      setShowAnimatedCard(true);
      // After animation completes, remove the animated card and update displayed card
      const timer = setTimeout(() => {
        setShowAnimatedCard(false);
        setDisplayedCard(animatingCard);
      }, 1900); // Slightly less than animation duration
      
      return () => clearTimeout(timer);
    } else {
      setDisplayedCard(cards.length > 0 ? cards[cards.length - 1] : null);
    }
  }, [animatingCard, cards]);
  
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
  const latestCard = displayedCard || (cards.length > 0 ? cards[cards.length - 1] : null);

  return (
    <div className="relative w-full h-64 flex items-center justify-center overflow-visible">
      <div className="absolute inset-0 bg-casino-dark rounded-xl opacity-90 z-0">
        {/* Decorative pattern for the table */}
        <div className="w-full h-full opacity-30" 
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 35%, rgba(76, 29, 149, 0.2) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(29, 78, 216, 0.2) 0%, transparent 60%)',
            backgroundSize: '100% 100%'
          }}>
        </div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center gap-4 w-full table-card-container">
        {cards.length === 0 && !animatingCard ? (
          <div className="text-gray-400 text-sm">
            Waiting for players...
          </div>
        ) : (
          <>
            <div className="relative h-32 w-24">
              {/* Display the stack of cards */}
              {cards.map((card, index) => (
                <CardComponent 
                  key={card.id} 
                  card={card} 
                  isTable={true} 
                  style={{
                    position: 'absolute',
                    zIndex: index + 1,
                    transform: `translateX(${index % 3 - 1}px) translateY(${index % 2}px) rotate(${(index % 5 - 2) * 3}deg)`
                  }}
                  className={index === cards.length - 1 && !animatingCard ? "shadow-lg" : ""}
                />
              ))}
            </div>
            
            {/* Display the animating card on top with enhanced animation */}
            {animatingCard && showAnimatedCard && (
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none z-50">
                <CardComponent 
                  key={`animating-${animatingCard.id}`} 
                  card={animatingCard} 
                  isTable={true}
                  animationType="throw"
                  playerPosition={animatingPlayerPosition}
                  className="shadow-lg"
                  playerCardElement={`player-card-${playerPositionToPlayerId(animatingPlayerPosition)}`}
                  style={{
                    position: 'absolute',
                    zIndex: 999,
                  }}
                />
              </div>
            )}
            
            {latestCard && (
              <div className="text-casino-gold text-sm font-medium bg-casino-dark/80 px-3 py-1 rounded-full mt-2 z-20">
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
