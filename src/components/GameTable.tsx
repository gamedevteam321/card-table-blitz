
import { useState } from "react";
import { Card, getCardValue } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";

interface GameTableProps {
  cards: Card[];
  orientation: 'horizontal' | 'vertical';
}

const GameTable = ({ cards, orientation }: GameTableProps) => {
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
    <div className={cn(
      "table-surface rounded-xl relative overflow-hidden p-8",
      "border-2 border-casino-table shadow-lg flex justify-center items-center",
      orientation === 'vertical' ? "h-56 w-full" : "h-80 w-full"
    )}>
      <div className="absolute inset-0 table-surface"></div>
      <div className={cn(
        "relative z-10 flex flex-col items-center justify-center gap-4 w-full"
      )}>
        {cards.length === 0 ? (
          <div className="text-gray-400 text-sm">
            No cards on the table
          </div>
        ) : (
          <>
            <div className="relative h-24 w-16">
              {cards.map((card, index) => (
                <CardComponent 
                  key={card.id} 
                  card={card} 
                  isTable={true} 
                  style={{
                    position: 'absolute',
                    zIndex: index + 1,
                    transform: `translateX(${index % 3 - 1}px) translateY(${index % 2}px) rotate(${(index % 5 - 2) * 1}deg)`
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
