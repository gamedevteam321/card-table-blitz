
import { useState } from "react";
import { Card } from "@/models/game";
import CardComponent from "./Card";
import { cn } from "@/lib/utils";

interface GameTableProps {
  cards: Card[];
  orientation: 'horizontal' | 'vertical';
}

const GameTable = ({ cards, orientation }: GameTableProps) => {
  return (
    <div className={cn(
      "table-surface rounded-xl relative overflow-hidden p-8",
      "border-2 border-casino-table shadow-lg flex justify-center items-center",
      orientation === 'vertical' ? "h-56 w-full" : "h-80 w-full"
    )}>
      <div className="absolute inset-0 table-surface"></div>
      <div className={cn(
        "relative z-10 flex items-center justify-center"
      )}>
        {cards.length === 0 ? (
          <div className="text-gray-400 text-sm">
            No cards on the table
          </div>
        ) : (
          <div className="relative">
            {cards.map((card, index) => (
              <CardComponent 
                key={card.id} 
                card={card} 
                isTable={true} 
                style={{
                  position: 'absolute',
                  zIndex: index + 1,
                  transform: `translateX(${index * 2}px) translateY(${index * 2}px) rotate(${(index % 3 - 1) * 2}deg)`
                }}
                className={index === cards.length - 1 ? "shadow-lg" : ""}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameTable;
