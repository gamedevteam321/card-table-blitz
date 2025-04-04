import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../../models/game';
import PlayerArea from '../PlayerArea';
import { useIsMobile } from '../../hooks/use-mobile';
import { useEffect, useState, useRef, useCallback } from 'react';

interface DistributingStateProps {
  players: Player[];
  playerPositions: Record<string, string>;
}

// Position mapping (clockwise order)
const POSITION_ORDER = ['bottom', 'left', 'top', 'right'];

// Card data for independent animations
interface CardAnimation {
  id: number;
  position: string;
  targetPlayerIndex: number;
  startTime: number;
  isArrived: boolean;
}

// Card trail effects
interface CardTrail {
  id: string;
  position: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotate: number;
  createdAt: number;
}

const DistributingState = ({ players, playerPositions }: DistributingStateProps) => {
  const isMobile = useIsMobile();
  
  // Distribution state
  const [cardsInDeck, setCardsInDeck] = useState(36); // Total cards in deck
  const [distributionProgress, setDistributionProgress] = useState(0);
  const [isDeckAnimating, setIsDeckAnimating] = useState(false);
  const [deckShakeIntensity, setDeckShakeIntensity] = useState(0);
  const [showDeckGlow, setShowDeckGlow] = useState(false);
  
  // Track all animated cards and effects
  const [animatedCards, setAnimatedCards] = useState<CardAnimation[]>([]);
  const [cardTrails, setCardTrails] = useState<CardTrail[]>([]);
  
  // Distribution timer
  const distributionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trailCleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const distributionStarted = useRef(false);
  
  // Find player by position
  const getPlayerIndexByPosition = useCallback((positionName: string) => {
    for (let i = 0; i < players.length; i++) {
      if (playerPositions[players[i].id] === positionName) {
        return i;
      }
    }
    return 0;
  }, [players, playerPositions]);
  
  // Get coordinates for different positions
  const getPositionCoordinates = useCallback((position: string) => {
    switch (position) {
      case 'bottom':
        return { x: 0, y: 200 };
      case 'left':
        return { x: -200, y: 0 };
      case 'top':
        return { x: 0, y: -200 };
      case 'right':
        return { x: 200, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  }, []);
  
  // Start the simultaneous distribution animation
  useEffect(() => {
    if (!distributionStarted.current) {
      distributionStarted.current = true;
      
      // Dramatic deck intro animation
      setDeckShakeIntensity(3);
      setShowDeckGlow(true);
      
      setTimeout(() => {
        setDeckShakeIntensity(0);
        setShowDeckGlow(false);
      }, 1500);
      
      // Function to create a card animation to a specific position
      const createCardAnimation = (position: string, delay: number) => {
        const playerIndex = getPlayerIndexByPosition(position);
        
        // Animate the deck first
        if (position === 'bottom') {
          setIsDeckAnimating(true);
          setTimeout(() => setIsDeckAnimating(false), 400);
        }
        
        // Create a small delay before the card appears
        setTimeout(() => {
          const newCardId = animatedCards.length;
          
          setAnimatedCards(prev => [
            ...prev,
            {
              id: newCardId,
              position,
              targetPlayerIndex: playerIndex,
              startTime: Date.now() + delay,
              isArrived: false
            }
          ]);
          
          // Generate trail effects
          setTimeout(() => {
            const generateTrail = () => {
              const coords = getPositionCoordinates(position);
              const totalSteps = 10;
              const trailDelay = 800 / totalSteps; // 800ms animation spread across steps
              
              for (let i = 0; i < totalSteps; i++) {
                setTimeout(() => {
                  // Calculate interpolated position along the path
                  let progress = i / totalSteps;
                  let trailX, trailY, trailRotate;
                  
                  switch (position) {
                    case 'bottom':
                      trailX = 0;
                      trailY = progress * coords.y;
                      trailRotate = 0;
                      break;
                    case 'left':
                      // Curved path for left
                      trailX = coords.x * progress;
                      trailY = -30 * Math.sin(progress * Math.PI);
                      trailRotate = 90 * progress;
                      break;
                    case 'top':
                      trailX = 0;
                      trailY = coords.y * progress;
                      trailRotate = 180 * progress;
                      break;
                    case 'right':
                      // Curved path for right
                      trailX = coords.x * progress;
                      trailY = -30 * Math.sin(progress * Math.PI);
                      trailRotate = -90 * progress;
                      break;
                    default:
                      trailX = 0;
                      trailY = 0;
                      trailRotate = 0;
                  }
                  
                  setCardTrails(trails => [
                    ...trails,
                    {
                      id: `trail-${position}-${newCardId}-${i}`,
                      position,
                      x: trailX,
                      y: trailY,
                      opacity: 0.3 - (0.25 * (i / totalSteps)),
                      scale: 0.7 - (0.3 * (i / totalSteps)),
                      rotate: trailRotate,
                      createdAt: Date.now()
                    }
                  ]);
                }, i * trailDelay);
              }
            };
            
            generateTrail();
          }, delay + 50);
          
          // Mark card as arrived after animation completes
          setTimeout(() => {
            setAnimatedCards(cards => 
              cards.map(card => 
                card.id === newCardId ? { ...card, isArrived: true } : card
              )
            );
            
            // Trigger flash effect on player area when card arrives
            const playerElement = document.getElementById(`player-${players[playerIndex].id}`);
            if (playerElement) {
              playerElement.classList.add('card-received-flash');
              setTimeout(() => {
                playerElement.classList.remove('card-received-flash');
              }, 300);
            }
          }, delay + 800);
          
          // Update deck count and progress
          setCardsInDeck(prev => Math.max(0, prev - 1));
          setDistributionProgress(prev => Math.min(100, prev + (100 / 36)));
        }, position === 'bottom' ? 200 : delay);
      };
      
      // Set up a timer to create animations to all directions
      distributionTimerRef.current = setInterval(() => {
        if (cardsInDeck <= 4) {
          // Stop when deck is empty
          if (distributionTimerRef.current) {
            clearInterval(distributionTimerRef.current);
            
            // Final flourish
            setShowDeckGlow(true);
            setTimeout(() => {
              setShowDeckGlow(false);
            }, 2000);
          }
          return;
        }
        
        // Create animations to all four directions with slight timing offsets
        createCardAnimation('bottom', 0);
        createCardAnimation('left', 100);
        createCardAnimation('top', 200);
        createCardAnimation('right', 300);
        
      }, 1200); // Create a new set of animations every 1.2 seconds
      
      // Set up trail cleanup timer
      trailCleanupTimerRef.current = setInterval(() => {
        const now = Date.now();
        setCardTrails(trails => trails.filter(trail => now - trail.createdAt < 1000));
      }, 1000);
    }
    
    return () => {
      if (distributionTimerRef.current) {
        clearInterval(distributionTimerRef.current);
      }
      if (trailCleanupTimerRef.current) {
        clearInterval(trailCleanupTimerRef.current);
      }
    };
  }, [cardsInDeck, getPlayerIndexByPosition, getPositionCoordinates, animatedCards.length, players]);
  
  // Position classes for different player positions
  const getPositionClass = useCallback((position: string) => {
    if (isMobile) {
      if (position === 'top') return 'top-2 left-1/2 transform -translate-x-1/2';
      if (position === 'right') return 'right-1 top-1/2 transform -translate-y-1/2';
      if (position === 'bottom') return 'bottom-2 left-1/2 transform -translate-x-1/2';
      if (position === 'left') return 'left-1 top-1/2 transform -translate-y-1/2';
    } else {
      if (position === 'top') return 'top-8 left-1/2 transform -translate-x-1/2';
      if (position === 'right') return 'right-8 top-1/2 transform -translate-y-1/2';
      if (position === 'bottom') return 'bottom-8 left-1/2 transform -translate-x-1/2';
      if (position === 'left') return 'left-8 top-1/2 transform -translate-y-1/2';
    }
    return '';
  }, [isMobile]);

  // Get animation path for different positions
  const getAnimationPath = useCallback((position: string) => {
    switch (position) {
      case 'bottom':
        return {
          x: [0, 0, 0, 0],
          y: [0, 50, 100, 200],
          scale: [1, 1.2, 1.1, 1],
          rotate: [0, 0, 0, 0],
          opacity: [0, 1, 1, 0.9]
        };
      case 'left':
        return {
          x: [0, -50, -120, -200],
          y: [0, -30, -20, 0],
          scale: [1, 1.2, 1.1, 1],
          rotate: [0, 30, 60, 90],
          opacity: [0, 1, 1, 0.9]
        };
      case 'top':
        return {
          x: [0, 0, 0, 0],
          y: [0, -50, -100, -200],
          scale: [1, 1.2, 1.1, 1],
          rotate: [0, 90, 135, 180],
          opacity: [0, 1, 1, 0.9]
        };
      case 'right':
        return {
          x: [0, 50, 120, 200],
          y: [0, -30, -20, 0],
          scale: [1, 1.2, 1.1, 1],
          rotate: [0, -30, -60, -90],
          opacity: [0, 1, 1, 0.9]
        };
      default:
        return {
          x: [0, 0],
          y: [0, 0],
          scale: [1, 1],
          rotate: [0, 0],
          opacity: [0, 0]
        };
    }
  }, []);
  
  // Get card color based on position
  const getCardColor = useCallback((position: string) => {
    switch (position) {
      case 'bottom':
        return 'bg-blue-600';
      case 'left':
        return 'bg-green-600';
      case 'top':
        return 'bg-red-600';
      case 'right':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  }, []);
  
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
      {/* Add CSS for flash effect */}
      <style>{`
        .card-received-flash {
          animation: card-received-flash 0.3s ease-out;
        }
        
        @keyframes card-received-flash {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.5); }
          100% { filter: brightness(1); }
        }
        
        .card-float {
          animation: card-float 3s ease-in-out infinite;
        }
        
        @keyframes card-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-casino p-2 rounded-lg shadow-lg border border-casino-table mb-4 flex justify-between items-center">
        <h1 className="text-base sm:text-xl font-bold text-casino-gold">Card Table Blitz</h1>
        <div className="text-xs sm:text-sm text-gray-400">
          Distributing cards... To all players
        </div>
      </div>
      
      {/* Game table */}
      <div className="relative flex-grow min-h-[calc(100vh-160px)] bg-casino-dark rounded-xl overflow-hidden">
        {/* Center table */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full sm:w-4/5 px-2 sm:px-0">
          <div className="w-full h-64 bg-casino-table rounded-lg shadow-lg flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl text-casino-gold mb-4">Distributing Cards</h2>
              
              {/* Progress bar */}
              <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${distributionProgress}%` }}
                />
              </div>
              
              {/* Card deck with animation */}
              <div 
                className={`mt-4 relative h-32 ${isDeckAnimating ? 'animate-pulse' : ''}`}
                style={{
                  transform: deckShakeIntensity > 0 ? `translate(${Math.sin(Date.now() / 100) * deckShakeIntensity}px, ${Math.cos(Date.now() / 120) * deckShakeIntensity}px)` : 'none'
                }}
              >
                {/* Deck glow effect */}
                {showDeckGlow && (
                  <motion.div
                    className="absolute rounded-full bg-yellow-400"
                    style={{
                      width: '120px',
                      height: '120px',
                      left: '-30px',
                      top: '-30px',
                      zIndex: 1,
                      filter: 'blur(20px)',
                      opacity: 0.4
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.6, 0.4]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                  />
                )}
                
                {/* Deck overlay for animation effects */}
                {isDeckAnimating && (
                  <motion.div
                    className="absolute w-20 h-28 bg-white opacity-30 rounded-md"
                    style={{
                      left: '0px',
                      top: '0px',
                      zIndex: 10,
                      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)'
                    }}
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
                
                {/* Static cards in deck with animation */}
                {Array.from({ length: Math.min(5, Math.max(cardsInDeck, 0)) }).map((_, i) => (
                  <motion.div
                    key={`static-${i}`}
                    className="absolute w-16 h-24 bg-white rounded-md shadow-lg card-back"
                    style={{
                      left: `${i * 3}px`,
                      top: `${i * 3}px`,
                      zIndex: 5 - i,
                      backgroundImage: 'repeating-linear-gradient(45deg, #1e3a8a, #1e3a8a 5px, #2563eb 5px, #2563eb 10px)',
                      border: '2px solid black',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    animate={
                      isDeckAnimating && i === 0
                        ? { 
                            x: [0, 10, 0], 
                            y: [0, -5, 0],
                            rotate: [0, -5, 0],
                            transition: { duration: 0.4 }
                          }
                        : {}
                    }
                  />
                ))}
                
                {/* Top card animation for dealing */}
                {isDeckAnimating && (
                  <motion.div
                    className="absolute w-16 h-24 rounded-md shadow-lg"
                    style={{
                      left: '0px',
                      top: '0px',
                      zIndex: 10,
                      backgroundImage: 'repeating-linear-gradient(45deg, #1e3a8a, #1e3a8a 5px, #2563eb 5px, #2563eb 10px)',
                      border: '2px solid black',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
                    }}
                    initial={{ x: 0, y: 0, rotate: 0 }}
                    animate={{ x: 20, y: -15, rotate: -10, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>
              
              {/* Distribution information */}
              <div className="text-white text-sm mt-2">
                <div>Cards remaining: {cardsInDeck}</div>
                <div className="mt-1 flex justify-center space-x-2">
                  {POSITION_ORDER.map((position) => (
                    <motion.span 
                      key={position} 
                      className={`inline-block w-4 h-4 rounded-full ${getCardColor(position)}`}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        repeatType: 'reverse',
                        delay: POSITION_ORDER.indexOf(position) * 0.25
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Player areas */}
        {players.map((player, index) => {
          const position = playerPositions[player.id];
          const scaleClass = isMobile ? 
            (position === 'left' || position === 'right' ? 'scale-80' : 'scale-90') : '';
          
          // Count completed cards for this player
          const playerCards = animatedCards.filter(
            card => card.position === position && card.isArrived
          ).length;
          
          return (
            <motion.div 
              key={player.id} 
              id={`player-${player.id}`}
              className={`absolute ${getPositionClass(position)} ${scaleClass}`}
              style={{ zIndex: 10 }}
              animate={{ 
                scale: playerCards > 0 ? [1, 1.02, 1] : 1
              }}
              transition={{ 
                duration: 1.5, 
                repeat: playerCards > 0 ? Infinity : 0, 
                repeatType: 'reverse' 
              }}
            >
              <PlayerArea
                player={player}
                isCurrentPlayer={false}
                onHit={() => {}}
                onShuffle={() => {}}
                timeRemaining={0}
                orientation={position === 'left' || position === 'right' ? 'vertical' : 'horizontal'}
                lastActionType="none"
                isDealing={true}
                positionClass={position}
                isCapturing={false}
                isMobile={isMobile}
                isAnimating={false}
              />
              
              {/* Player indicator */}
              <div className={`absolute left-1/2 transform -translate-x-1/2 -top-6 ${getCardColor(position)} text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg`}>
                <span className="inline-block w-2 h-2 bg-white rounded-full"></span>
                {playerCards > 0 && (
                  <span className="ml-1 text-xs">x{playerCards}</span>
                )}
              </div>
              
              {/* Card received indicator */}
              {playerCards > 0 && (
                <motion.div
                  className="absolute -top-2 -right-2 bg-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  {playerCards}
                </motion.div>
              )}
            </motion.div>
          );
        })}
        
        {/* Card trail effects */}
        <AnimatePresence>
          {cardTrails.map((trail) => (
            <motion.div
              key={trail.id}
              className={`absolute w-12 h-18 rounded-md ${getCardColor(trail.position)}`}
              style={{
                left: '50%',
                top: '50%',
                zIndex: 25,
                opacity: trail.opacity,
                scale: trail.scale,
                filter: 'blur(2px)'
              }}
              initial={false}
              animate={{
                x: trail.x,
                y: trail.y,
                rotate: trail.rotate,
                opacity: [trail.opacity, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          ))}
        </AnimatePresence>
        
        {/* Independent card animations */}
        <AnimatePresence>
          {animatedCards.map((card) => {
            const animPath = getAnimationPath(card.position);
            
            return (
              <motion.div
                key={`card-${card.position}-${card.id}`}
                className={`absolute w-16 h-24 rounded-md shadow-lg ${getCardColor(card.position)}`}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 30 + card.id,
                  border: '2px solid white',
                  boxShadow: card.isArrived 
                    ? '0 0 15px rgba(255, 255, 255, 0.5), 0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
                }}
                initial={{ 
                  x: animPath.x[0],
                  y: animPath.y[0],
                  scale: animPath.scale[0],
                  rotate: animPath.rotate[0],
                  opacity: animPath.opacity[0]
                }}
                animate={{ 
                  x: animPath.x[3],
                  y: animPath.y[3],
                  scale: animPath.scale[3],
                  rotate: animPath.rotate[3],
                  opacity: animPath.opacity[3]
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                  delay: (Date.now() - card.startTime) / 1000 > 0 ? 0 : (card.startTime - Date.now()) / 1000
                }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 8px 16px -2px rgba(0, 0, 0, 0.4)'
                }}
              >
                {/* Card symbol */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span 
                    className="text-white font-bold text-2xl"
                    animate={card.isArrived ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                  >
                    {card.position === 'bottom' ? 'S' :
                     card.position === 'left' ? 'C' :
                     card.position === 'top' ? 'H' :
                     'D'}
                  </motion.span>
                </div>
                
                {/* Arrival highlight effect */}
                {card.isArrived && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="absolute inset-0 border-2 border-white rounded-md"></div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Paths connecting dealer to players */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
          {POSITION_ORDER.map((position) => {
            // Path coordinates based on position
            let x2, y2;
            let pathType;
            
            switch (position) {
              case 'bottom':
                x2 = '50%'; y2 = '75%';
                pathType = 'straight';
                break;
              case 'left':
                x2 = '30%'; y2 = '50%';
                pathType = 'curve';
                break;
              case 'top':
                x2 = '50%'; y2 = '25%';
                pathType = 'straight';
                break;
              case 'right':
                x2 = '70%'; y2 = '50%';
                pathType = 'curve';
                break;
              default:
                x2 = '50%'; y2 = '50%';
                pathType = 'straight';
            }
            
            // Count animated cards for this position
            const positionCards = animatedCards.filter(card => card.position === position).length;
            
            return pathType === 'curve' ? (
              <motion.path
                key={`path-${position}`}
                d={position === 'left' 
                  ? `M 50% 50% Q 40% 35% ${x2} ${y2}` 
                  : `M 50% 50% Q 60% 35% ${x2} ${y2}`}
                stroke={getCardColor(position).replace('bg-', 'stroke-').replace('-600', '-400')}
                strokeWidth="2"
                strokeDasharray="5,5"
                fill="none"
                animate={{ 
                  strokeDashoffset: [0, -20],
                  strokeWidth: positionCards > 0 ? [2, 3, 2] : 2
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity,
                  repeatType: 'loop'
                }}
              />
            ) : (
              <motion.path
                key={`path-${position}`}
                d={`M 50% 50% L ${x2} ${y2}`}
                stroke={getCardColor(position).replace('bg-', 'stroke-').replace('-600', '-400')}
                strokeWidth="2"
                strokeDasharray="5,5"
                fill="none"
                animate={{ 
                  strokeDashoffset: [0, -20],
                  strokeWidth: positionCards > 0 ? [2, 3, 2] : 2
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity,
                  repeatType: 'loop'
                }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default DistributingState; 