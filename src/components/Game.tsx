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
import { Button } from './ui/button';
import { Pause, Play, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';

const TURN_TIME_LIMIT = 10; // seconds
const GAME_TIME_LIMIT = 120; // seconds (2 minutes)

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
  });

  const [timeRemaining, setTimeRemaining] = useState(TURN_TIME_LIMIT);
  const [gameTimeRemaining, setGameTimeRemaining] = useState(GAME_TIME_LIMIT);
  const [isDealing, setIsDealing] = useState(false);
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'info' as const });
  const [lastActionType, setLastActionType] = useState<'none' | 'hit' | 'capture'>('none');
  const [gameActive, setGameActive] = useState(false);
  const [capturePosition, setCapturePosition] = useState<{ x: number; y: number } | null>(null);
  const [showCaptureConfetti, setShowCaptureConfetti] = useState(false);
  const [capturingPlayerId, setCapturingPlayerId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
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

    setTimeout(() => {
      toast({ title: text });
    }, 0);
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
    setLastActionType('hit');
    
    setTimeout(() => {
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex];
        
        if (currentPlayer.cards.length === 0) {
          return prev;
        }
        
        const [playedCard, ...remainingCards] = currentPlayer.cards;
        
        const isMatch = checkCardMatch(playedCard, prev.tableCards);
        
        const updatedPlayers = [...prev.players];
        
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
            cards: [...remainingCards, ...prev.tableCards, playedCard],
          };
          
          if (remainingCards.length === 0) {
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
            };
          }
          
          return {
            ...prev,
            players: updatedPlayers,
            tableCards: [],
            turnStartTime: Date.now(),
          };
        } else {
          updatedPlayers[prev.currentPlayerIndex] = {
            ...currentPlayer,
            cards: remainingCards,
          };
          
          if (remainingCards.length === 0) {
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
                tableCards: [...prev.tableCards, playedCard],
                status: 'finished',
                winner: activePlayers[0],
              };
            }
          }
          
          const nextPlayerIndex = getNextPlayerIndex(updatedPlayers, prev.currentPlayerIndex);
          
          return {
            ...prev,
            players: updatedPlayers,
            currentPlayerIndex: nextPlayerIndex,
            tableCards: [...prev.tableCards, playedCard],
            turnStartTime: Date.now(),
            message: `${updatedPlayers[nextPlayerIndex].name}'s turn`,
          };
        }
      });
      
      setTimeout(() => {
        setLastActionType('none');
      }, 500);
    }, 100);
  }, [displayMessage]);

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
    setGameState(prev => {
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
        
        const isMatch = checkCardMatch(playedCard, prev.tableCards);
        
        if (isMatch && prev.tableCards.length > 0) {
          updatedPlayers[prev.currentPlayerIndex] = {
            ...updatedPlayers[prev.currentPlayerIndex],
            cards: [...remainingCards, ...prev.tableCards, playedCard],
          };
          
          return {
            ...prev,
            players: updatedPlayers,
            tableCards: [],
            currentPlayerIndex: getNextPlayerIndex(updatedPlayers, prev.currentPlayerIndex),
            turnStartTime: Date.now(),
          };
        } else {
          return {
            ...prev,
            players: updatedPlayers,
            tableCards: [...prev.tableCards, playedCard],
            currentPlayerIndex: getNextPlayerIndex(updatedPlayers, prev.currentPlayerIndex),
            turnStartTime: Date.now(),
          };
        }
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
  }, [displayMessage]);

  const handleShuffle = useCallback(() => {
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
  }, [displayMessage]);

  const handleQuitGame = useCallback(() => {
    setIsPauseDialogOpen(false);
    setGameState({
      players: [],
      currentPlayerIndex: 0,
      tableCards: [],
      status: 'setup',
      winner: null,
      message: '',
      turnStartTime: 0,
      gameStartTime: 0,
    });
    setTimeRemaining(TURN_TIME_LIMIT);
    setGameTimeRemaining(GAME_TIME_LIMIT);
    setLastActionType('none');
    setGameActive(false);
    setIsDealing(false);
    setShowStatusMessage(false);
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
    });
    setTimeRemaining(TURN_TIME_LIMIT);
    setGameTimeRemaining(GAME_TIME_LIMIT);
  };

  const handlePauseResume = () => {
    if (!gameActive || gameState.status !== 'playing') return;
    
    if (isPaused) {
      const currentTime = Date.now();
      setGameState(prev => ({
        ...prev,
        turnStartTime: currentTime,
        gameStartTime: currentTime - (GAME_TIME_LIMIT - gameTimeRemaining) * 1000
      }));
      setIsPaused(false);
    } else {
      setIsPaused(true);
      setIsPauseDialogOpen(true);
    }
  };

  const handleContinueGame = () => {
    setIsPauseDialogOpen(false);
    setIsPaused(false);
    const currentTime = Date.now();
    setGameState(prev => ({
      ...prev,
      turnStartTime: currentTime,
      gameStartTime: currentTime - (GAME_TIME_LIMIT - gameTimeRemaining) * 1000
    }));
  };

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

  const getPlayerPositions = () => {
    const positions = isMobile ? ['bottom', 'top', 'left', 'right'] : ['bottom', 'right', 'top', 'left'];
    const playerPositions: Record<string, string> = {};
    
    for (let i = 0; i < gameState.players.length; i++) {
      const player = gameState.players[i];
      let positionIndex = 0;
      
      if (i === 0) {
        positionIndex = 0; // Bottom
      } else if (gameState.players.length <= 3) {
        positionIndex = i % positions.length;
      } else {
        positionIndex = i % positions.length;
      }
      
      playerPositions[player.id] = positions[positionIndex];
    }
    
    return playerPositions;
  };

  const playerPositions = getPlayerPositions();

  return (
    <div className="w-full max-w-7xl mx-auto">
      <StatusMessage 
        message={statusMessage.text}
        type={statusMessage.type}
        isVisible={showStatusMessage}
        onHide={() => setShowStatusMessage(false)}
      />
      
      {showCaptureConfetti && capturePosition && (
        <Confetti isActive={true} position={capturePosition} />
      )}
      
      <div className="bg-casino p-4 rounded-lg shadow-lg border border-casino-table mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-casino-gold">Card Table Blitz</h1>
          <div className="text-sm text-gray-400">
            Game time: {Math.floor(gameTimeRemaining / 60)}:{(gameTimeRemaining % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex gap-2">
            {gameActive && gameState.status === 'playing' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePauseResume}
                className="text-gray-400 hover:text-white hover:bg-secondary/20"
              >
                {isPaused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsPauseDialogOpen(true)}
              className="text-gray-400 hover:text-white hover:bg-destructive/20"
            >
              <X className="w-4 h-4 mr-1" />
              Quit
            </Button>
          </div>
        </div>
      </div>
      
      <div className="relative md:h-[600px] h-[450px] bg-casino-dark rounded-xl overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 md:w-3/4 lg:w-2/3">
          <GameTable cards={gameState.tableCards} />
        </div>
        
        {gameState.players.map((player, index) => {
          const position = playerPositions[player.id];
          const isCurrentPlayer = index === gameState.currentPlayerIndex;
          const isCapturing = player.id === capturingPlayerId;
          
          let positionClass = '';
          if (position === 'top') {
            positionClass = 'top-4 left-1/2 transform -translate-x-1/2';
          } else if (position === 'right') {
            positionClass = 'right-4 top-1/2 transform -translate-y-1/2';
          } else if (position === 'bottom') {
            positionClass = 'bottom-4 left-1/2 transform -translate-x-1/2';
          } else if (position === 'left') {
            positionClass = 'left-4 top-1/2 transform -translate-y-1/2';
          }
          
          let maxWidthClass = '';
          if (isMobile) {
            if (position === 'left' || position === 'right') {
              maxWidthClass = 'max-w-[120px]';
            } else {
              maxWidthClass = 'max-w-[180px]';
            }
          } else {
            maxWidthClass = 'max-w-xs';
          }
          
          return (
            <div 
              key={player.id} 
              id={`player-${player.id}`}
              className={`absolute ${positionClass} ${maxWidthClass}`}
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
                positionClass={position}
                isCapturing={isCapturing}
                isPaused={isPaused}
              />
            </div>
          );
        })}
      </div>
      
      <Dialog open={isPauseDialogOpen} onOpenChange={setIsPauseDialogOpen}>
        <DialogContent className="bg-casino-dark border-casino-table">
          <DialogHeader>
            <DialogTitle className="text-center text-casino-gold">Game Paused</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 p-4">
            <Button 
              variant="default" 
              onClick={handleContinueGame}
              className="bg-casino-accent hover:bg-casino-accent/90 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Continue Game
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleQuitGame}
            >
              <X className="w-4 h-4 mr-2" />
              Quit Game
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Game;
