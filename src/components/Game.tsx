import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Card, createDeck, shuffleDeck, generatePlayerColors, GameState as GameStateType } from '../models/game';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import PlayerArea from './PlayerArea';
import GameTable from './GameTable';
import StatusMessage from './StatusMessage';
import Confetti from './Confetti';
import SetupScreen from './SetupScreen';
import GameOverScreen from './GameOverScreen';
import PauseMenu from './PauseMenu';
import CardBack from './CardBack';
import { checkCardMatch } from '../models/game';

import WaitingState from './game-states/WaitingState';
import ShufflingState from './game-states/ShufflingState';
import DistributingState from './game-states/DistributingState';
import PlayingState from './game-states/PlayingState';

const TURN_TIME_LIMIT = 10; // seconds
const GAME_TIME_LIMIT = 120; // seconds (2 minutes)
const ANIMATION_DURATION = 800; // milliseconds

interface GameState {
  status: 'waiting' | 'shuffling' | 'distributing' | 'playing' | 'finished';
  players: Player[];
  currentPlayerIndex: number;
  tableCards: Card[];
  animatingCard: Card | null;
  isAnimating: boolean;
  turnStartTime: number;
  message: string;
  winner: Player | null;
  distributionProgress: number;
}

const createPlayers = (count: number, deck: Card[]): Player[] => {
  const colors = generatePlayerColors(count);
  const cardsPerPlayer = Math.floor(deck.length / count);
  const players: Player[] = [];
  
  for (let i = 0; i < count; i++) {
    const playerCards = deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
    
    players.push({
      id: `player-${i}`,
      name: `Player ${i + 1}`,
      cards: playerCards,
      status: 'active',
      shufflesRemaining: 1,
      autoPlayCount: 0,
      avatarColor: colors[i],
    });
  }
  
  return players;
};

// Add getTargetPosition function
const getTargetPosition = (playerPosition: string) => {
  switch (playerPosition) {
    case 'top':
      return { x: 0, y: -200, rotate: 180 };
    case 'right':
      return { x: 200, y: 0, rotate: 90 };
    case 'bottom':
      return { x: 0, y: 200, rotate: 0 };
    case 'left':
      return { x: -200, y: 0, rotate: -90 };
    default:
      return { x: 0, y: 0, rotate: 0 };
  }
};

const Game = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    players: [],
    currentPlayerIndex: 0,
    tableCards: [],
    animatingCard: null,
    isAnimating: false,
    turnStartTime: Date.now(),
    message: 'Click Start Game to begin',
    winner: null,
    distributionProgress: 0
  });

  const [timeRemaining, setTimeRemaining] = useState(TURN_TIME_LIMIT);
  const [gameTimeRemaining, setGameTimeRemaining] = useState(GAME_TIME_LIMIT);
  const [isDealing, setIsDealing] = useState(false);
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'warning' | 'error' });
  const [lastActionType, setLastActionType] = useState<'none' | 'hit' | 'capture' | 'throw'>('none');
  const [gameActive, setGameActive] = useState(false);
  const [capturePosition, setCapturePosition] = useState<{ x: number; y: number } | null>(null);
  const [showCaptureConfetti, setShowCaptureConfetti] = useState(false);
  const [capturingPlayerId, setCapturingPlayerId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [throwingPlayerPosition, setThrowingPlayerPosition] = useState<'top' | 'left' | 'right' | 'bottom' | null>(null);
  const [showShuffleAnimation, setShowShuffleAnimation] = useState(false);
  const [shuffleProgress, setShuffleProgress] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [totalCards, setTotalCards] = useState(52); // Total number of cards in the deck
  
  // Add new state for distribution animation
  const [isDistributing, setIsDistributing] = useState(false);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Define getPlayerPositions and playerPositions early
  const getPlayerPositions = () => {
    const playerPositions: Record<string, string> = {};
    
    gameState.players.forEach((player, index) => {
      if (index === 0) {
        playerPositions[player.id] = 'bottom';
      } else if (index === 1) {
        playerPositions[player.id] = 'left';
      } else if (index === 2) {
        playerPositions[player.id] = 'top';
      } else if (index === 3) {
        playerPositions[player.id] = 'right';
      }
    });
    
    return playerPositions;
  };

  const playerPositions = getPlayerPositions();

  const startGame = useCallback(() => {
    // Start with shuffling state
    setGameState(prev => ({
      ...prev,
      status: 'shuffling',
      message: 'Shuffling cards...'
    }));

    setShowShuffleAnimation(true);
    setShuffleProgress(0);

    // Shuffle animation
    const shuffleInterval = setInterval(() => {
      setShuffleProgress(prev => {
        if (prev >= 100) {
          clearInterval(shuffleInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // After shuffle animation, transition to dealing
    setTimeout(() => {
      setShowShuffleAnimation(false);
      const deck = createDeck();
      const shuffledDeck = shuffleDeck(deck);
      const players = createPlayers(4, shuffledDeck);
      
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        players,
        message: 'Distributing cards...'
      }));

      // Reset card distribution state
      setCurrentCardIndex(0);
      setTotalCards(shuffledDeck.length);
      setIsDistributing(true);
      setIsDealing(true);

      // Start card-by-card distribution
      const distributionInterval = setInterval(() => {
        setCurrentCardIndex(prev => {
          if (prev >= shuffledDeck.length) {
            clearInterval(distributionInterval);
            setIsDistributing(false);
            setIsDealing(false);
            // Update game state after distribution
            setGameState(prevState => ({
              ...prevState,
              currentPlayerIndex: 0,
              tableCards: [],
              animatingCard: null,
              isAnimating: false,
              turnStartTime: Date.now(),
              message: `${prevState.players[0].name}'s turn`,
              winner: null
            }));
            return prev;
          }
          return prev + 1;
        });
      }, 100);
    }, 2500); // 2.5 seconds for shuffle animation
  }, []);

  const displayMessage = useCallback((text: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setStatusMessage({ text, type });
    setShowStatusMessage(true);

    if (type === 'success' || type === 'warning' || type === 'error') {
      toast({ title: text });
    }
  }, [toast]);

  const handleDealComplete = useCallback(() => {
    setIsDealing(false);
    
    setGameState(prev => ({
      ...prev,
      turnStartTime: Date.now(),
    }));
    
    setGameActive(true);
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer) {
      displayMessage(`${currentPlayer.name}'s turn`, 'info');
    }
  }, [gameState.players, gameState.currentPlayerIndex, displayMessage]);

  const nextPlayer = useCallback(() => {
    setGameState(prev => {
      let nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      
      while (
        prev.players[nextIndex].status === 'inactive' || 
        prev.players[nextIndex].status === 'kicked'
      ) {
        nextIndex = (nextIndex + 1) % prev.players.length;
        
        if (nextIndex === prev.currentPlayerIndex) {
          return {
            ...prev,
            status: 'finished',
          };
        }
      }
      
      return {
        ...prev,
        currentPlayerIndex: nextIndex,
        turnStartTime: Date.now(),
        message: `${prev.players[nextIndex].name}'s turn`,
      };
    });
  }, []);

  const getPositionForPlayer = (playerId: string) => {
    const playerElement = document.getElementById(`player-${playerId}`);
    if (!playerElement) return null;
    
    const rect = playerElement.getBoundingClientRect();
    return {
      x: (rect.left + rect.right) / 2 / window.innerWidth * 100,
      y: (rect.top + rect.bottom) / 2 / window.innerHeight * 100
    };
  };

  const handleHit = useCallback(() => {
    if (gameState.isAnimating || isDistributing) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer) {
      const position = playerPositions[currentPlayer.id] as 'top' | 'left' | 'right' | 'bottom' | null;
      setThrowingPlayerPosition(position);
    }
    
    setLastActionType('throw');
    setGameState(prev => ({ ...prev, isAnimating: true }));
    
    setTimeout(() => {
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex];
        
        if (currentPlayer.cards.length === 0) {
          return { ...prev, isAnimating: false };
        }
        
        const [playedCard, ...remainingCards] = currentPlayer.cards;
        
        // First step: Move card to animation state
        return {
          ...prev,
          players: prev.players.map((p, i) => 
            i === prev.currentPlayerIndex ? { ...p, cards: remainingCards } : p
          ),
          animatingCard: { ...playedCard },
        };
      });
      
      // Let the animation play, then handle the card placement
      setTimeout(() => {
        setGameState(prev => {
          if (!prev.animatingCard) return prev;
          
          const currentPlayer = prev.players[prev.currentPlayerIndex];
          const isMatch = checkCardMatch(prev.animatingCard!, prev.tableCards);
          const updatedPlayers = [...prev.players];
          
          // Handle match case
          if (isMatch && prev.tableCards.length > 0) {
            displayMessage('Cards matched!', 'success');
            setLastActionType('capture');
            
            setCapturingPlayerId(currentPlayer.id);
            setShowCaptureConfetti(true);
            
            const position = getPositionForPlayer(currentPlayer.id);
            if (position) {
              setCapturePosition(position);
            }
            
            setTimeout(() => {
              setShowCaptureConfetti(false);
              setCapturingPlayerId(null);
              setCapturePosition(null);
            }, 1500);
            
            updatedPlayers[prev.currentPlayerIndex] = {
              ...currentPlayer,
              cards: [...currentPlayer.cards, ...prev.tableCards, prev.animatingCard],
            };
            
            if (currentPlayer.cards.length === 0) {
              const winner = updatedPlayers
                .filter(p => p.id !== currentPlayer.id)
                .reduce((prev, curr) => 
                  (prev.cards.length > curr.cards.length) ? prev : curr
                );
                
              return {
                ...prev,
                players: updatedPlayers.map(p => ({
                  ...p,
                  status: p.id === winner.id ? 'winner' : 'loser'
                })),
                tableCards: [],
                status: 'finished',
                winner,
                animatingCard: null,
                isAnimating: false,
              };
            }
            
            return {
              ...prev,
              players: updatedPlayers,
              tableCards: [],
              turnStartTime: Date.now(),
              animatingCard: null,
              isAnimating: false,
            };
          }
          
          // No match, add card to table
          if (currentPlayer.cards.length === 0) {
            updatedPlayers[prev.currentPlayerIndex].status = 'inactive';
            displayMessage(`${currentPlayer.name} is out of cards!`, 'warning');
            
            const activePlayers = updatedPlayers.filter(
              p => p.status === 'active' && p.cards.length > 0
            );
            
            if (activePlayers.length === 1) {
              return {
                ...prev,
                players: updatedPlayers.map(p => ({
                  ...p,
                  status: p.id === activePlayers[0].id ? 'winner' : 'loser'
                })),
                tableCards: [...prev.tableCards, prev.animatingCard!],
                status: 'finished',
                winner: activePlayers[0],
                animatingCard: null,
                isAnimating: false,
              };
            }
          }
          
          const nextPlayerIndex = getNextPlayerIndex(updatedPlayers, prev.currentPlayerIndex);
          
          // Keep the animation going until it's complete
          return {
            ...prev,
            players: updatedPlayers,
            currentPlayerIndex: nextPlayerIndex,
            tableCards: [...prev.tableCards, prev.animatingCard!],
            turnStartTime: Date.now(),
            message: `${updatedPlayers[nextPlayerIndex].name}'s turn`,
            // Don't reset animatingCard and isAnimating here
          };
        });
        
        // Reset animation state after a delay to ensure the animation completes
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            animatingCard: null,
            isAnimating: false
          }));
          setLastActionType('none');
        }, 500); // Add a small delay to ensure smooth transition
      }, ANIMATION_DURATION);
    }, 100);
  }, [displayMessage, gameState.isAnimating, isDistributing, playerPositions]);

  const getNextPlayerIndex = (players: Player[], currentIndex: number) => {
    let nextIndex = (currentIndex + 1) % players.length;
    
    while (
      players[nextIndex].status !== 'active' || 
      players[nextIndex].cards.length === 0
    ) {
      nextIndex = (nextIndex + 1) % players.length;
      
      if (nextIndex === currentIndex) {
        return currentIndex;
      }
    }
    
    return nextIndex;
  };

  const handleAutoPlay = useCallback(() => {
    if (gameState.isAnimating) return;
    
    setGameState(prev => {
      if (prev.isAnimating) return prev;
      
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const updatedPlayers = [...prev.players];
      
      const newAutoPlayCount = currentPlayer.autoPlayCount + 1;
      
      if (newAutoPlayCount >= 2) {
        updatedPlayers[prev.currentPlayerIndex] = {
          ...currentPlayer,
          status: 'kicked',
          autoPlayCount: newAutoPlayCount,
        };
        
        displayMessage(`${currentPlayer.name} kicked for inactivity!`, 'error');
        
        const activePlayers = updatedPlayers.filter(p => p.status === 'active');
        
        if (activePlayers.length === 1) {
          return {
            ...prev,
            players: updatedPlayers.map(p => ({
              ...p,
              status: p.id === activePlayers[0].id ? 'winner' : 'loser'
            })),
            status: 'finished',
            winner: activePlayers[0],
          };
        }
      } else {
        updatedPlayers[prev.currentPlayerIndex] = {
          ...currentPlayer,
          autoPlayCount: newAutoPlayCount,
        };
        
        displayMessage('Auto-played!', 'warning');
      }
      
      if (currentPlayer.cards.length > 0) {
        const [playedCard, ...remainingCards] = currentPlayer.cards;
        
        updatedPlayers[prev.currentPlayerIndex] = {
          ...updatedPlayers[prev.currentPlayerIndex],
          cards: remainingCards,
        };
        
        // Set up animation
        const newState = {
          ...prev,
          players: updatedPlayers,
          isAnimating: true,
          animatingCard: playedCard
        };
        
        // We'll handle the rest with a setTimeout like in handleHit
        setTimeout(() => {
          setGameState(autoState => {
            const isMatch = checkCardMatch(playedCard, autoState.tableCards);
            
            if (isMatch && autoState.tableCards.length > 0) {
              updatedPlayers[autoState.currentPlayerIndex] = {
                ...updatedPlayers[autoState.currentPlayerIndex],
                cards: [...remainingCards, ...autoState.tableCards, playedCard],
              };
              
              return {
                ...autoState,
                players: updatedPlayers,
                tableCards: [],
                currentPlayerIndex: getNextPlayerIndex(updatedPlayers, autoState.currentPlayerIndex),
                turnStartTime: Date.now(),
                animatingCard: null,
                isAnimating: false,
              };
            } else {
              return {
                ...autoState,
                players: updatedPlayers,
                tableCards: [...autoState.tableCards, playedCard],
                currentPlayerIndex: getNextPlayerIndex(updatedPlayers, autoState.currentPlayerIndex),
                turnStartTime: Date.now(),
                animatingCard: null,
                isAnimating: false,
              };
            }
          });
        }, ANIMATION_DURATION);
        
        return newState;
      }
      
      return {
        ...prev,
        players: updatedPlayers.map((p, i) => 
          i === prev.currentPlayerIndex ? { ...p, status: 'inactive' } : p
        ),
        currentPlayerIndex: getNextPlayerIndex(updatedPlayers, prev.currentPlayerIndex),
        turnStartTime: Date.now(),
      };
    });
  }, [displayMessage, gameState.isAnimating]);

  const handleShuffle = useCallback(() => {
    if (gameState.isAnimating || isDistributing) return;
    
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      
      if (currentPlayer.shufflesRemaining <= 0) {
        return prev;
      }
      
      const shuffledCards = shuffleDeck(currentPlayer.cards);
      
      const updatedPlayers = [...prev.players];
      updatedPlayers[prev.currentPlayerIndex] = {
        ...currentPlayer,
        cards: shuffledCards,
        shufflesRemaining: currentPlayer.shufflesRemaining - 1,
      };
      
      displayMessage('Shuffled!', 'info');
      
      return {
        ...prev,
        players: updatedPlayers,
      };
    });
  }, [displayMessage, gameState.isAnimating, isDistributing]);

  const handleQuitGame = useCallback(() => {
    setGameState({
      players: [],
      currentPlayerIndex: 0,
      tableCards: [],
      status: 'waiting',
      winner: null,
      message: 'Click Start Game to begin',
      turnStartTime: 0,
      animatingCard: null,
      isAnimating: false,
      distributionProgress: 0
    });
    setTimeRemaining(TURN_TIME_LIMIT);
    setGameTimeRemaining(GAME_TIME_LIMIT);
    setLastActionType('none');
    setGameActive(false);
    setIsDealing(false);
    setShowStatusMessage(false);
    setIsPaused(false);
  }, []);

  const handlePlayAgain = () => {
    setGameState({
      players: [],
      currentPlayerIndex: 0,
      tableCards: [],
      status: 'waiting',
      winner: null,
      message: 'Click Start Game to begin',
      turnStartTime: 0,
      animatingCard: null,
      isAnimating: false,
      distributionProgress: 0
    });
    setTimeRemaining(TURN_TIME_LIMIT);
    setGameTimeRemaining(GAME_TIME_LIMIT);
  };

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
    
    if (isPaused) {
      setGameState(prev => ({
        ...prev,
        turnStartTime: Date.now(),
      }));
    }
  }, [isPaused]);

  const handleResumeGame = useCallback(() => {
    setIsPaused(false);
    
    setGameState(prev => ({
      ...prev,
      turnStartTime: Date.now(),
    }));
  }, []);

  const handleGameOver = useCallback(() => {
        setGameState(prev => ({
          ...prev,
          status: 'finished',
      message: 'Game Over!',
      turnStartTime: Date.now()
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      status: 'waiting',
      players: [],
      currentPlayerIndex: 0,
      tableCards: [],
      animatingCard: null,
      isAnimating: false,
      turnStartTime: Date.now(),
      message: 'Click Start Game to begin',
      winner: null,
      distributionProgress: 0
    });
    setIsPaused(false);
    setThrowingPlayerPosition(null);
  }, []);

  useEffect(() => {
    if (gameState.status === 'playing' && gameState.players.length > 0) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      
      if (currentPlayer) {
        setTimeout(() => {
          displayMessage(`${currentPlayer.name}'s turn`, 'info');
        }, 0);
      }
    }
  }, [gameState.currentPlayerIndex, gameState.status, displayMessage]);

  if (gameState.status === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-casino-dark p-4">
        <SetupScreen onStartGame={(playerNames, playerCount) => {
          const deck = shuffleDeck(createDeck());
          const players = createPlayers(playerCount, deck);
          // Update player names
          players.forEach((player, index) => {
            player.name = playerNames[index];
          });
          setGameState(prev => ({
            ...prev,
            players,
            status: 'shuffling',
            message: 'Shuffling cards...'
          }));
          setShowShuffleAnimation(true);
          setShuffleProgress(0);

          // Shuffle animation
          const shuffleInterval = setInterval(() => {
            setShuffleProgress(prev => {
              if (prev >= 100) {
                clearInterval(shuffleInterval);
                return 100;
              }
              return prev + 2;
            });
          }, 50);

          // Transition to playing state after shuffle
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              status: 'playing',
              message: 'Distributing cards...'
            }));
            setShowShuffleAnimation(false);
            setShuffleProgress(0);
            setIsDistributing(true);
            setCurrentCardIndex(0);
            setTotalCards(deck.length);

            // Distribution animation
            const distributionInterval = setInterval(() => {
              setCurrentCardIndex(prev => {
                if (prev >= deck.length) {
                  clearInterval(distributionInterval);
                  setIsDistributing(false);
                  // Transition to playing state
                  setGameState(prevState => ({
                    ...prevState,
                    currentPlayerIndex: 0,
                    tableCards: [],
                    animatingCard: null,
                    isAnimating: false,
                    turnStartTime: Date.now(),
                    message: `${prevState.players[0].name}'s turn`,
                    winner: null
                  }));
                  return prev;
                }
                return prev + 1;
              });
            }, 100);
          }, 2500); // 2.5 seconds for shuffle animation
        }} />
      </div>
    );
  }

  if (gameState.status === 'shuffling') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-casino-dark p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Shuffling Cards...</h2>
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-[#16A34A] transition-all duration-300"
              style={{ width: `${shuffleProgress}%` }}
            />
          </div>
          <div className="relative w-24 h-36 mx-auto">
            {/* Deck of cards */}
            {Array.from({ length: 5 }).map((_, i) => (
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

            {/* Shuffling animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key="shuffling"
                className="absolute inset-0 bg-white rounded-lg border-2 border-gray-300 shadow-lg"
                initial={{ x: 0, y: 0, rotate: 0, scale: 1 }}
                animate={{
                  x: [0, 20, -20, 0],
                  y: [0, -20, 20, 0],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <CardBack />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'distributing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-casino-dark p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Dealing Cards...</h2>
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-[#16A34A] transition-all duration-300"
              style={{ width: `${(currentCardIndex / totalCards) * 100}%` }}
            />
          </div>
          <div className="relative w-24 h-36 mx-auto">
            {/* Deck of remaining cards */}
            {Array.from({ length: Math.min(5, totalCards - currentCardIndex) }).map((_, i) => (
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
                  ...getTargetPosition(playerPositions[gameState.players[Math.floor(currentCardIndex / (totalCards / gameState.players.length))]?.id] || 'bottom'),
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
        </div>
      </div>
    );
  }

  if (gameState.status === 'playing') {
    return (
      <>
        {/* Distribution overlay */}
        {isDistributing && (
          <div className="absolute inset-0 z-50 pointer-events-none">
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-xl bg-black/50 px-4 py-2 rounded-lg">
              Dealing cards... {Math.floor((currentCardIndex / totalCards) * 100)}%
            </div>
            
            {/* Dealer position (center) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative w-24 h-36">
                {/* Deck of remaining cards */}
                {Array.from({ length: Math.min(5, totalCards - currentCardIndex) }).map((_, i) => (
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
                      ...getTargetPosition(playerPositions[gameState.players[Math.floor(currentCardIndex / (totalCards / gameState.players.length))]?.id] || 'bottom'),
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
            </div>
          </div>
        )}
        
        <PlayingState
          players={gameState.players}
          currentPlayerIndex={gameState.currentPlayerIndex}
          tableCards={gameState.tableCards}
          animatingCard={gameState.animatingCard}
          isAnimating={gameState.isAnimating}
          timeRemaining={timeRemaining}
          gameTimeRemaining={gameTimeRemaining}
          lastActionType={lastActionType}
          isDealing={isDealing}
          showStatusMessage={showStatusMessage}
          statusMessage={statusMessage}
          showCaptureConfetti={showCaptureConfetti}
          capturePosition={capturePosition}
          isPaused={isPaused}
          throwingPlayerPosition={throwingPlayerPosition}
          playerPositions={playerPositions}
          capturingPlayerId={capturingPlayerId}
          onHideStatusMessage={() => setShowStatusMessage(false)}
          onTogglePause={togglePause}
          onResumeGame={handleResumeGame}
          onQuitGame={handleQuitGame}
          onHit={handleHit}
          onShuffle={handleShuffle}
        />
      </>
    );
  }

  if (gameState.status === 'finished' && gameState.winner) {
    return <GameOverScreen 
      winner={gameState.winner} 
      players={gameState.players}
      onPlayAgain={handlePlayAgain} 
    />;
  }

  return null;
};

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

export default Game;
