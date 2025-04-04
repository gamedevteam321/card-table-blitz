import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../../models/game';
import PlayerArea from '../PlayerArea';
import { useIsMobile } from '../../hooks/use-mobile';
import { useEffect, useState } from 'react';

interface DistributingStateProps {
  distributionProgress: number;
  players: Player[];
  playerPositions: Record<string, string>;
}

const DistributingState = ({ distributionProgress, players, playerPositions }: DistributingStateProps) => {
  const isMobile = useIsMobile();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);

  const getPlayerPosition = (index: number) => {
    switch (index) {
      case 0: // Bottom
        return { x: 0, y: 200, rotate: 0 };
      case 1: // Left
        return { x: -200, y: 0, rotate: 90 };
      case 2: // Top
        return { x: 0, y: -200, rotate: 180 };
      case 3: // Right
        return { x: 200, y: 0, rotate: 270 };
      default:
        return { x: 0, y: 0, rotate: 0 };
    }
  };

  useEffect(() => {
    if (distributionProgress > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentCardIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= 36) { // 4 players * 3 cards * 3 cycles
          return prev;
        }
        return nextIndex;
      });

      // Update current player and cycle
      const cardsPerPlayer = 3;
      const totalCardsPerCycle = players.length * cardsPerPlayer;
      const newPlayerIndex = Math.floor((currentCardIndex + 1) % totalCardsPerCycle / cardsPerPlayer);
      const newCycle = Math.floor((currentCardIndex + 1) / totalCardsPerCycle);
      
      setCurrentPlayerIndex(newPlayerIndex);
      setCurrentCycle(newCycle);
      setIsAnimating(false);
    }
  }, [distributionProgress, isAnimating, currentCardIndex, players.length]);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
      <div className="bg-casino p-2 rounded-lg shadow-lg border border-casino-table mb-4 flex justify-between items-center">
        <h1 className="text-base sm:text-xl font-bold text-casino-gold">Card Table Blitz</h1>
        <div className="text-xs sm:text-sm text-gray-400">
          Distributing cards... Cycle {currentCycle + 1} of 3
        </div>
      </div>
      
      <div className="relative flex-grow min-h-[calc(100vh-160px)] bg-casino-dark rounded-xl overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full sm:w-4/5 px-2 sm:px-0">
          <div className="w-full h-64 bg-casino-table rounded-lg shadow-lg flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl text-casino-gold mb-4">Distributing Cards</h2>
              <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${distributionProgress}%` }}
                />
              </div>
              {/* Deck of cards */}
              <div className="mt-4 relative">
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-16 h-24 bg-white rounded-md shadow-lg"
                    style={{
                      left: `${i * 4}px`,
                      top: `${i * 4}px`,
                      zIndex: 3 - i
                    }}
                    initial={{ rotate: 0 }}
                    animate={{
                      rotate: [0, 5, -5, 0],
                      y: [0, -5, 5, 0]
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {players.map((player, index) => {
          const position = playerPositions[player.id];
          const isCurrentPlayer = index === currentPlayerIndex;
          const isCapturing = false;
          
          let positionClass = '';
          
          if (isMobile) {
            if (position === 'top') {
              positionClass = 'top-2 left-1/2 transform -translate-x-1/2';
            } else if (position === 'right') {
              positionClass = 'right-1 top-1/2 transform -translate-y-1/2';
            } else if (position === 'bottom') {
              positionClass = 'bottom-2 left-1/2 transform -translate-x-1/2';
            } else if (position === 'left') {
              positionClass = 'left-1 top-1/2 transform -translate-y-1/2';
            }
          } else {
            if (position === 'top') {
              positionClass = 'top-8 left-1/2 transform -translate-x-1/2';
            } else if (position === 'right') {
              positionClass = 'right-8 top-1/2 transform -translate-y-1/2';
            } else if (position === 'bottom') {
              positionClass = 'bottom-8 left-1/2 transform -translate-x-1/2';
            } else if (position === 'left') {
              positionClass = 'left-8 top-1/2 transform -translate-y-1/2';
            }
          }
          
          const scaleClass = isMobile ? 
            (position === 'left' || position === 'right' ? 'scale-80' : 'scale-90') : '';
          
          return (
            <div 
              key={player.id} 
              id={`player-${player.id}`}
              className={`absolute ${positionClass} ${scaleClass}`}
              style={{ zIndex: 10 }}
            >
              <PlayerArea
                player={player}
                isCurrentPlayer={isCurrentPlayer}
                onHit={() => {}}
                onShuffle={() => {}}
                timeRemaining={0}
                orientation={position === 'left' || position === 'right' ? 'vertical' : 'horizontal'}
                lastActionType="none"
                isDealing={true}
                positionClass={position}
                isCapturing={isCapturing}
                isMobile={isMobile}
                isAnimating={isAnimating && isCurrentPlayer}
              />
            </div>
          );
        })}

        {/* Animated card flying from deck to player */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              className="absolute w-16 h-24 bg-white rounded-md shadow-lg"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 20
              }}
              initial={{ 
                x: 0,
                y: 0,
                rotate: 0,
                scale: 1,
                opacity: 1
              }}
              animate={{
                x: getPlayerPosition(currentPlayerIndex).x,
                y: getPlayerPosition(currentPlayerIndex).y,
                rotate: getPlayerPosition(currentPlayerIndex).rotate,
                scale: [1, 1.2, 1],
                opacity: [1, 1, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeOut"
              }}
            />
          )}
        </AnimatePresence>

        {/* Player highlight effect */}
        {players.map((player, index) => {
          if (index === currentPlayerIndex) {
            return (
              <motion.div
                key={`highlight-${player.id}`}
                className="absolute w-32 h-32 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 5
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  opacity: [0, 0.5, 0]
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut"
                }}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default DistributingState; 