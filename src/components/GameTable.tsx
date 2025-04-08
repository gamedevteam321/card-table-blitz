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
    <div className={cn(
      "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
      isMobile ? "w-3/4" : "w-full sm:w-4/5",
      "px-2 sm:px-0"
    )}>
      <div className={cn(
        "relative flex items-center justify-center mx-auto",
        isMobile ? "w-48 h-48" : "w-96 h-96"
      )}>
        {/* Outer table border with gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-casino-gold/0 to-casino-gold/0 p-2 sm:p-4">
          {/* Main table surface with enhanced styling */}
          <div className="absolute inset-0 bg-casino-table rounded-xl opacity-95 z-0 table-surface">
            {/* Decorative center pattern */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "rounded-full bg-casino-highlight opacity-30 blur-2xl animate-pulse",
                isMobile ? "w-24 h-24" : "w-48 h-48"
              )}></div>
            </div>
            
            {/* Table edge highlights with gradient */}
            <div className="absolute inset-0 rounded-xl border-2 sm:border-4 border-casino-gold/30"></div>
            
            {/* Corner decorations with enhanced styling */}
            <div className={cn(
              "absolute border-t-2 border-l-2 sm:border-t-4 sm:border-l-4 border-casino-gold/40",
              isMobile ? "top-1 left-1 w-6 h-6 rounded-tl-md" : "top-4 left-4 w-12 h-12 rounded-tl-xl"
            )}></div>
            <div className={cn(
              "absolute border-t-2 border-r-2 sm:border-t-4 sm:border-r-4 border-casino-gold/40",
              isMobile ? "top-1 right-1 w-6 h-6 rounded-tr-md" : "top-4 right-4 w-12 h-12 rounded-tr-xl"
            )}></div>
            <div className={cn(
              "absolute border-b-2 border-l-2 sm:border-b-4 sm:border-l-4 border-casino-gold/40",
              isMobile ? "bottom-1 left-1 w-6 h-6 rounded-bl-md" : "bottom-4 left-4 w-12 h-12 rounded-bl-xl"
            )}></div>
            <div className={cn(
              "absolute border-b-2 border-r-2 sm:border-b-4 sm:border-r-4 border-casino-gold/40",
              isMobile ? "bottom-1 right-1 w-6 h-6 rounded-br-md" : "bottom-4 right-4 w-12 h-12 rounded-br-xl"
            )}></div>
            
            {/* Decorative side patterns */}
            <div className={cn(
              "absolute top-1/2 left-4 sm:left-8 w-1 sm:w-2 bg-casino-gold/20 rounded-full",
              isMobile ? "h-12" : "h-24"
            )}></div>
            <div className={cn(
              "absolute top-1/2 right-4 sm:right-8 w-1 sm:w-2 bg-casino-gold/20 rounded-full",
              isMobile ? "h-12" : "h-24"
            )}></div>
            <div className={cn(
              "absolute left-1/2 top-4 sm:top-8 h-1 sm:h-2 bg-casino-gold/20 rounded-full",
              isMobile ? "w-12" : "w-24"
            )}></div>
            <div className={cn(
              "absolute left-1/2 bottom-4 sm:bottom-8 h-1 sm:h-2 bg-casino-gold/20 rounded-full",
              isMobile ? "w-12" : "w-24"
            )}></div>
          </div>
        </div>
        
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
                            `translateX(${Math.random() > 0.5 ? -10 : -10}px) rotate(${Math.random() > 0.5 ? -30 : -30}deg)` : 
                            'none',
                          transition: 'all 0.3s ease-out'
                        }}
                        className={cn(
                          isTopCard ? "shadow-xl" : "opacity-90",
                          "hover:scale-110 hover:rotate-2 transition-all duration-300"
                        )}
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
