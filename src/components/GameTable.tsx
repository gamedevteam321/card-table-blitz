
import { useState, useEffect } from "react";
import { Card, getCardValue } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";
import { useScreenSize } from "@/hooks/use-screen-size";

interface GameTableProps {
  cards: Card[];                            // Cards displayed on the table
  animatingCard: Card | null;               // Card currently being animated
  animatingPlayerPosition?: 'top' | 'left' | 'right' | 'bottom' | null; // Position of the player who played the animating card
}

const GameTable = ({ cards, animatingCard, animatingPlayerPosition = null }: GameTableProps) => {
  const { screenSize, isSmallMobile } = useScreenSize();
  const [displayedCard, setDisplayedCard] = useState<Card | null>(null);  // Current card to display
  const [showAnimatedCard, setShowAnimatedCard] = useState(true);         // Control visibility of animated card
  
  // Adjust table height based on screen size
  const getTableHeight = () => {
    switch(screenSize) {
      case 'small': return 'h-48';   // Small screen height
      case 'medium': return 'h-56';  // Medium screen height
      default: return 'h-64';        // Default/large screen height
    }
  };
  
  // When animation completes, show the card in the deck
  useEffect(() => {
    if (animatingCard) {
      setShowAnimatedCard(true);
      // After animation completes, remove the animated card and update displayed card
      const timer = setTimeout(() => {
        setShowAnimatedCard(false);
        setDisplayedCard(animatingCard);
      }, 600); // Match the animation duration from Card component
      
      return () => clearTimeout(timer);
    } else {
      // If no card is animating, show the top card from the deck
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

  // Scale cards for small mobile devices
  const cardScale = isSmallMobile ? "scale-75" : "";

  return (
    <div className={cn(
      "relative w-full flex items-center justify-center overflow-visible",
      getTableHeight()
    )}>
      {/* Casino table surface with decorative pattern */}
      <div className="absolute inset-0 bg-casino-dark rounded-xl opacity-90 z-0 table-surface">
        <div className="w-full h-full opacity-30" 
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 35%, rgba(76, 29, 149, 0.2) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(29, 78, 216, 0.2) 0%, transparent 60%)',
            backgroundSize: '100% 100%'
          }}>
        </div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center gap-4 w-full table-card-container">
        {cards.length === 0 && !animatingCard ? (
          /* Display message when there are no cards on the table */
          <div className="text-gray-400 text-sm">
            Waiting for players...
          </div>
        ) : (
          <>
            <div className={cn(
              "relative center-card-area",
              isSmallMobile ? "h-24 w-18" : "h-32 w-24"
            )}>
              {/* Display the stack of cards on the table */}
              {cards.map((card, index) => (
                <CardComponent 
                  key={card.id} 
                  card={card} 
                  isTable={true} 
                  style={{
                    position: 'absolute',
                    zIndex: index + 1,
                    // Offset each card slightly for stack effect
                    transform: `translateX(${index % 3 - 1}px) translateY(${index % 2}px) rotate(${(index % 5 - 2) * 3}deg)`
                  }}
                  className={cn(
                    index === cards.length - 1 && !animatingCard ? "shadow-lg" : "",
                    cardScale
                  )}
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
                  className={cn("shadow-lg", cardScale)}
                  style={{
                    position: 'absolute',
                    zIndex: 999,
                  }}
                />
              </div>
            )}
            
            {/* Display the card name at the bottom */}
            {latestCard && (
              <div className={cn(
                "text-casino-gold bg-casino-dark/80 rounded-full mt-2 z-20",
                isSmallMobile ? "text-xs px-2 py-0.5" : "text-sm font-medium px-3 py-1"
              )}>
                {isSmallMobile 
                  ? `${latestCard.rank} of ${latestCard.suit.charAt(0).toUpperCase()}` // Shorter text for mobile
                  : getCardName(latestCard)} {/* Full card name for larger screens */}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GameTable;
