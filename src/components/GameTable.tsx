
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
        "relative z-10 flex items-center justify-center",
        orientation === 'vertical' ? "flex-row flex-wrap gap-2" : "flex-row gap-1"
      )}>
        {cards.length === 0 ? (
          <div className="text-gray-400 text-sm">
            No cards on the table
          </div>
        ) : (
          cards.map((card, index) => (
            <CardComponent 
              key={card.id} 
              card={card} 
              isTable={true} 
              className={cn(
                "transform",
                orientation === 'vertical' 
                  ? "translate-y-0" 
                  : `translate-x-${index * 2} translate-y-${index % 2 === 0 ? '0' : '1'}`
              )}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GameTable;
