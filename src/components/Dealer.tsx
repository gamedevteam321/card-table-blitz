
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Player } from "@/models/game";

interface DealerProps {
  isDealing: boolean;
  orientation: 'horizontal' | 'vertical';
  onDealComplete?: () => void;
  players?: Player[];
}

const Dealer = ({ isDealing, orientation, onDealComplete, players = [] }: DealerProps) => {
  const [dealIndex, setDealIndex] = useState(0);
  const totalDeals = players.length * 3; // Deal 3 cards visually to each player
  
  useEffect(() => {
    if (isDealing) {
      const dealInterval = setInterval(() => {
        setDealIndex(prev => {
          const next = prev + 1;
          if (next >= totalDeals) {
            clearInterval(dealInterval);
            setTimeout(() => {
              if (onDealComplete) onDealComplete();
            }, 500);
            return totalDeals;
          }
          return next;
        });
      }, 300);
      
      return () => clearInterval(dealInterval);
    } else {
      setDealIndex(0);
    }
  }, [isDealing, totalDeals, onDealComplete]);
  
  // Calculate dealing targets
  const getPlayerPosition = (playerIndex: number) => {
    if (orientation === 'vertical') {
      return { x: 0, y: 200 + (playerIndex * 50) };
    } else {
      return { x: 100 + (playerIndex * 100), y: 100 };
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3",
      orientation === 'vertical' ? "flex-col" : "flex-row"
    )}>
      <div className="relative w-16 h-20">
        <motion.img 
          src="https://cdn-icons-png.flaticon.com/512/4320/4320372.png" 
          alt="Dealer" 
          className="w-full h-full object-contain"
          animate={isDealing ? {
            rotate: [0, -5, 5, -2, 0],
            y: [0, -3, 0]
          } : {}}
          transition={{
            duration: 0.3,
            repeat: isDealing ? Infinity : 0,
            repeatType: "reverse"
          }}
        />
        
        {/* Dealing animation */}
        {isDealing && players.map((player, playerIndex) => {
          // Show dealing animation for current player
          const playerDealStart = playerIndex * 3;
          const playerDealEnd = playerDealStart + 3;
          const isCurrentPlayerDealing = dealIndex >= playerDealStart && dealIndex < playerDealEnd;
          const target = getPlayerPosition(playerIndex);
          
          return isCurrentPlayerDealing && (
            <motion.div 
              key={player.id}
              className="absolute top-0 -right-2 w-10 h-14 bg-white border border-gray-300 rounded-md card-back"
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{ 
                x: target.x, 
                y: target.y, 
                rotate: 360, 
                opacity: 0 
              }}
              transition={{ 
                duration: 0.5,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-casino-gold">Dealer</span>
        <span className="text-xs text-gray-400">
          {isDealing ? "Dealing cards..." : "Waiting for players..."}
        </span>
      </div>
    </div>
  );
};

export default Dealer;
