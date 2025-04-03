
import { useState } from "react";
import { Card, getCardValue } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface GameTableProps {
  cards: Card[];
}

const GameTable = ({ cards }: GameTableProps) => {
  const isMobile = useIsMobile();
  
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

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <div className="absolute inset-0 bg-casino-dark rounded-xl opacity-90 z-0"></div>
      
      {/* Circular direction indicators */}
      {!isMobile ? (
        <>
          <div className="absolute top-1/3 left-1/4 z-10">
            <div className="w-12 h-12 rounded-full bg-casino-dark/50 border border-gray-600 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 12L14 18V13H4V11H14V6L20 12Z" fill="#6b7280" />
              </svg>
            </div>
          </div>
          
          <div className="absolute bottom-1/3 right-1/4 z-10">
            <div className="w-12 h-12 rounded-full bg-casino-dark/50 border border-gray-600 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12L10 6V11H20V13H10V18L4 12Z" fill="#6b7280" />
              </svg>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="absolute top-1/4 left-1/3 z-10">
            <div className="w-8 h-8 rounded-full bg-casino-dark/50 border border-gray-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 12L14 18V13H4V11H14V6L20 12Z" fill="#6b7280" />
              </svg>
            </div>
          </div>
          
          <div className="absolute bottom-1/4 right-1/3 z-10">
            <div className="w-8 h-8 rounded-full bg-casino-dark/50 border border-gray-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12L10 6V11H20V13H10V18L4 12Z" fill="#6b7280" />
              </svg>
            </div>
          </div>
        </>
      )}
      
      <div className="relative z-10 flex flex-col items-center justify-center gap-4 w-full">
        {cards.length === 0 ? (
          <div className="text-gray-400 text-sm">
            Waiting for players...
          </div>
        ) : (
          <>
            <div className="relative h-32 w-24">
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
                  className={index === cards.length - 1 ? "shadow-lg" : ""}
                />
              ))}
            </div>
            {cards.length > 0 && (
              <div className="text-casino-gold text-sm font-medium bg-casino-dark/80 px-3 py-1 rounded-full mt-2">
                {getCardName(cards[cards.length - 1])}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GameTable;
