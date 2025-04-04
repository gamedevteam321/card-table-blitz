
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, GameState, Player, checkCardMatch, createDeck, generatePlayerColors, shuffleDeck } from '@/models/game';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import PlayerArea from './PlayerArea';
import GameTable from './GameTable';
import StatusMessage from './StatusMessage';
import Confetti from './Confetti';
import SetupScreen from './SetupScreen';
import GameOverScreen from './GameOverScreen';
import PauseMenu from './PauseMenu';
import { Button } from './ui/button';
import { X } from 'lucide-react';

const TURN_TIME_LIMIT = 10; // seconds
const GAME_TIME_LIMIT = 120; // seconds (2 minutes)
const ANIMATION_DURATION = 700; // milliseconds - match with Card component

const Game = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    tableCards: [],
    status: 'setup',
    winner: null,
    message: '',
    turnStartTime: 0,
    gameStartTime: 0,
    animatingCard: null,
    isAnimating: false,
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
  
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Define getPlayerPositions and playerPositions early
  const getPlayerPositions = () => {
    const playerPositions: Record<string, string> = {};
    
    gameState.players.forEach((player, index) => {
      if (index === 0) {
        playerPositions[player.id] = 'bottom';
      } else if (gameState.players.length <= 4) {
        // For 2-4 players, distribute evenly
        if (index === 1) {
          playerPositions[player.id] = gameState.players.length === 2 ? 'top' : 'left';
        } else if (index === 2) {
          playerPositions[player.id] = gameState.players.length === 3 ? 'right' : 'top';
        } else if (index === 3) {
          playerPositions[player.id] = 'right';
        }
      } else {
        // For 5+ players, use a more complex layout
        if (index === 1) playerPositions[player.id] = 'left';
        else if (index === 2) playerPositions[player.id] = 'top-left';
        else if (index === 3) playerPositions[player.id] = 'top';
        else if (index === 4) playerPositions[player.id] = 'top-right';
        else if (index === 5) playerPositions[player.id] = 'right';
        else playerPositions[player.id] = 'spectator';
      }
    });
    
    return playerPositions;
  };

  const playerPositions = getPlayerPositions();

  const startGame = useCallback((playerNames: string[], playerCount: number) => {
    let deck = createDeck();
    deck = shuffleDeck(deck);
    
    const colors = generatePlayerColors(playerCount);
    
    const cardsPerPlayer = Math.floor(deck.length / playerCount);
    const players: Player[] = [];
    
    for (let i = 0; i < playerCount; i++) {
      const playerCards = deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
      
      players.push({
        id: `player-${i}`,
        name: playerNames[i],
        cards: playerCards,
        status: 'active',
        shufflesRemaining: 1,
        autoPlayCount: 0,
        avatarColor: colors[i],
      });
    }
    
    const firstPlayerIndex = Math.floor(Math.random() * playerCount);
    
    setGameState({
      players,
      currentPlayerIndex: firstPlayerIndex,
      tableCards: [],
      status: 'playing',
      winner: null,
      message: `${players[firstPlayerIndex].name}'s turn`,
      turnStartTime: 0,
      gameStartTime: 0,
      animatingCard: null,
      isAnimating: false,
    });
    
    setIsDealing(true);
    setGameActive(false);

    setTimeout(() => {
      handleDealComplete();
    }, 2000);
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
      gameStartTime: Date.now(),
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
    if (gameState.isAnimating) return;
    
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
          } else {
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
            
            return {
              ...prev,
              players: updatedPlayers,
              currentPlayerIndex: nextPlayerIndex,
              tableCards: [...prev.tableCards, prev.animatingCard!],
              turnStartTime: Date.now(),
              message: `${updatedPlayers[nextPlayerIndex].name}'s turn`,
              animatingCard: null,
              isAnimating: false,
            };
          }
        });
        
        setLastActionType('none');
      }, ANIMATION_DURATION);
    }, 100);
  }, [displayMessage, gameState.isAnimating, playerPositions]);

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
    if (gameState.isAnimating) return;
    
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
  }, [displayMessage, gameState.isAnimating]);

  const handleQuitGame = useCallback(() => {
    setGameState({
      players: [],
      currentPlayerIndex: 0,
      tableCards: [],
      status: 'setup',
      winner: null,
      message: '',
      turnStartTime: 0,
      gameStartTime: 0,
      animatingCard: null,
      isAnimating: false,
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
      status: 'setup',
      winner: null,
      message: '',
      turnStartTime: 0,
      gameStartTime: 0,
      animatingCard: null,
      isAnimating: false,
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

  useEffect(() => {
    if (gameState.status !== 'playing' || !gameActive || isPaused) return;
    
    const timer = setInterval(() => {
      const elapsedTurnTime = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
      const remainingTurnTime = Math.max(0, TURN_TIME_LIMIT - elapsedTurnTime);
      
      setTimeRemaining(remainingTurnTime);
      
      if (remainingTurnTime === 0) {
        handleAutoPlay();
      }
      
      const elapsedGameTime = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
      const remainingGameTime = Math.max(0, GAME_TIME_LIMIT - elapsedGameTime);
      
      setGameTimeRemaining(remainingGameTime);
      
      if (remainingGameTime === 0 && gameState.status === 'playing') {
        const sortedPlayers = [...gameState.players].sort((a, b) => b.cards.length - a.cards.length);
        const winner = sortedPlayers[0];
        
        setGameState(prev => ({
          ...prev,
          status: 'finished',
          winner,
          players: prev.players.map(p => ({
            ...p,
            status: p.id === winner.id ? 'winner' : 'loser'
          })),
        }));
        
        displayMessage('Time\'s up! Game over!', 'warning');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState.status, gameState.turnStartTime, gameState.gameStartTime, handleAutoPlay, gameActive, displayMessage, isPaused]);

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

  if (gameState.status === 'setup') {
    return <SetupScreen onStartGame={startGame} />;
  }

  if (gameState.status === 'finished' && gameState.winner) {
    return <GameOverScreen 
      winner={gameState.winner} 
      players={gameState.players}
      onPlayAgain={handlePlayAgain} 
    />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
      <StatusMessage 
        message={statusMessage.text}
        type={statusMessage.type}
        isVisible={showStatusMessage}
        onHide={() => setShowStatusMessage(false)}
      />
      
      <div className="bg-casino p-2 rounded-lg shadow-lg border border-casino-table mb-4 flex justify-between items-center">
        <h1 className="text-base sm:text-xl font-bold text-casino-gold">Card Table Blitz</h1>
        <div className="text-xs sm:text-sm text-gray-400">
          Game time: {Math.floor(gameTimeRemaining / 60)}:{(gameTimeRemaining % 60).toString().padStart(2, '0')}
        </div>
        <div className="flex gap-2">
          <PauseMenu 
            isPaused={isPaused}
            onTogglePause={togglePause}
            onResume={handleResumeGame}
            onQuit={handleQuitGame}
          />
        </div>
      </div>
      
      {showCaptureConfetti && capturePosition && (
        <Confetti isActive={true} position={capturePosition} />
      )}
      
      <div className="relative flex-grow min-h-[calc(100vh-160px)] bg-casino-dark rounded-xl overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full sm:w-4/5 px-2 sm:px-0">
          <GameTable 
            cards={gameState.tableCards} 
            animatingCard={gameState.animatingCard}
            animatingPlayerPosition={throwingPlayerPosition}
          />
        </div>
        
        {gameState.players.map((player, index) => {
          const position = playerPositions[player.id];
          const isCurrentPlayer = index === gameState.currentPlayerIndex;
          const isCapturing = player.id === capturingPlayerId;
          
          let positionClass = '';
          
          if (isMobile) {
            // Mobile positioning
            if (position === 'top') {
              positionClass = 'top-2 left-1/2 transform -translate-x-1/2';
            } else if (position === 'right') {
              positionClass = 'right-1 top-1/2 transform -translate-y-1/2';
            } else if (position === 'bottom') {
              positionClass = 'bottom-2 left-1/2 transform -translate-x-1/2';
            } else if (position === 'left') {
              positionClass = 'left-1 top-1/2 transform -translate-y-1/2';
            } else if (position === 'top-left') {
              positionClass = 'top-2 left-4';
            } else if (position === 'top-right') {
              positionClass = 'top-2 right-4';
            }
          } else {
            // Desktop positioning
            if (position === 'top') {
              positionClass = 'top-8 left-1/2 transform -translate-x-1/2';
            } else if (position === 'right') {
              positionClass = 'right-8 top-1/2 transform -translate-y-1/2';
            } else if (position === 'bottom') {
              positionClass = 'bottom-8 left-1/2 transform -translate-x-1/2';
            } else if (position === 'left') {
              positionClass = 'left-8 top-1/2 transform -translate-y-1/2';
            } else if (position === 'top-left') {
              positionClass = 'top-8 left-1/4 transform -translate-x-1/2';
            } else if (position === 'top-right') {
              positionClass = 'top-8 right-1/4 transform translate-x-1/2';
            }
          }
          
          const scaleClass = isMobile ? 
            (position === 'left' || position === 'right' ? 'scale-80' : 'scale-90') : '';
          
          return (
            <div 
              key={player.id} 
              id={`player-${player.id}`}
              className={`absolute ${positionClass} ${scaleClass}`}
              style={{ zIndex: isCurrentPlayer ? 20 : 10 }}
            >
              <PlayerArea
                player={player}
                isCurrentPlayer={isCurrentPlayer}
                onHit={handleHit}
                onShuffle={handleShuffle}
                timeRemaining={timeRemaining}
                orientation={position === 'left' || position === 'right' ? 'vertical' : 'horizontal'}
                lastActionType={isCurrentPlayer ? lastActionType : 'none'}
                isDealing={isDealing}
                positionClass={position as any}
                isCapturing={isCapturing}
                isMobile={isMobile}
                isAnimating={gameState.isAnimating}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Game;
