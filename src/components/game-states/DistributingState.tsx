import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/models/game';
import { cn } from '@/lib/utils';
import CardBack from '../CardBack';

interface DistributingStateProps {
  players: Player[];
  playerPositions: Record<string, string>;
  currentCardIndex: number;
  totalCards: number;
}

const DistributingState = ({ 
  players, 
  playerPositions,
  currentCardIndex,
  totalCards
}: DistributingStateProps) => {
  // Calculate which player is receiving the current card
  const currentPlayerIndex = Math.floor(currentCardIndex / (totalCards / players.length));
  const progress = (currentCardIndex / totalCards) * 100;

  // Get the target position for the current card
  const getTargetPosition = (playerPosition: string) => {
    switch (playerPosition) {
      case 'top':
        return { x: '0%', y: '-200%', rotate: 180 };
      case 'right':
        return { x: '200%', y: '0%', rotate: 90 };
      case 'bottom':
        return { x: '0%', y: '200%', rotate: 0 };
      case 'left':
        return { x: '-200%', y: '0%', rotate: -90 };
      default:
        return { x: '0%', y: '0%', rotate: 0 };
    }
  };

  // Calculate remaining cards in deck
  const remainingCards = totalCards - currentCardIndex;

  return (
    <div className="relative w-full h-screen bg-casino-dark flex items-center justify-center overflow-hidden">
      {/* Progress indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-xl">
        Dealing cards... {Math.floor(progress)}%
      </div>

      {/* Dealer position (center) */}
      <div className="relative w-24 h-36">
        {/* Deck of remaining cards */}
        {Array.from({ length: Math.min(5, remainingCards) }).map((_, i) => (
          <motion.div
            key={`deck-${i}`}
            className="absolute inset-0 bg-white rounded-lg border-2 border-gray-300 shadow-lg"
            style={{
              zIndex: 5 - i,
              transform: `translateY(${i * 0.5}px)`
            }}
            animate={{
              y: [i * 0.5, i * 0.5 - 2, i * 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.1
            }}
          >
            <CardBack />
          </motion.div>
        ))}

        {/* Animating card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCardIndex}
            className="absolute inset-0 bg-white rounded-lg border-2 border-gray-300 shadow-lg"
            initial={{ x: 0, y: 0, rotate: 0, scale: 1 }}
            animate={{
              ...getTargetPosition(playerPositions[players[currentPlayerIndex]?.id] || 'bottom'),
              scale: 0.8,
            }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.5
            }}
          >
            <CardBack />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Player positions with card stacks */}
      {players.map((player, index) => (
        <div
          key={player.id}
          className={cn(
            "absolute transform -translate-x-1/2 -translate-y-1/2",
            playerPositions[player.id] === 'top' && "top-[15%] left-1/2",
            playerPositions[player.id] === 'right' && "top-1/2 right-[15%] translate-x-1/2",
            playerPositions[player.id] === 'bottom' && "bottom-[15%] left-1/2",
            playerPositions[player.id] === 'left' && "top-1/2 left-[15%] -translate-x-1/2"
          )}
        >
          {/* Player avatar */}
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white",
            "bg-red-500 ring-4 relative",
            currentPlayerIndex === index ? "ring-yellow-400" : "ring-white"
          )}>
            {player.name[0].toUpperCase()}
            
            {/* Card stack for received cards */}
            {currentCardIndex > 0 && index <= currentPlayerIndex && (
              <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2">
                <div className="relative w-16 h-24">
                  {Array.from({ length: Math.min(3, Math.floor((currentCardIndex / players.length) + (index === currentPlayerIndex ? -1 : 0))) }).map((_, i) => (
                    <motion.div
                      key={`stack-${i}`}
                      className="absolute inset-0 bg-white rounded-lg border-2 border-gray-300 shadow-lg"
                      style={{
                        transform: `translateY(${i * -2}px) rotate(${(index === 0 ? 0 : index === 1 ? 90 : index === 2 ? 180 : -90)}deg)`
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <CardBack />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Player name */}
          <div className="mt-2 text-center text-white font-medium">
            {player.name}
            <div className="text-sm text-gray-300">
              {Math.floor(currentCardIndex / players.length) + (index < currentPlayerIndex ? 1 : 0)} cards
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DistributingState; 