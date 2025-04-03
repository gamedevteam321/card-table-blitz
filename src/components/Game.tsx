
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
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const orientation = isMobile ? 'vertical' as const : 'horizontal' as const;
  
  // Initialize game
  const startGame = useCallback((playerNames: string[], playerCount: number) => {
    // Create and shuffle the deck
    let deck = createDeck();
    deck = shuffleDeck(deck);
    
    // Generate avatar colors for players
    const colors = generatePlayerColors(playerCount);
    
    // Distribute cards equally
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
    
    // Randomly select first player
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

    // Simulate dealing animation
    setTimeout(() => {
      handleDealComplete();
    }, 2000);
  }, []);

  // Display status message
  const displayMessage = useCallback((text: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setStatusMessage({ text, type });
    setShowStatusMessage(true);

    // Use setTimeout to avoid the React warning about setState during rendering
    setTimeout(() => {
      toast({ title: text });
    }, 0);
  }, [toast]);
  
  // Handle dealer animation completion
  const handleDealComplete = useCallback(() => {
    setIsDealing(false);
    
    // Start the game timer and turn timer only after dealing
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
  
  // Advance to next player
  const nextPlayer = useCallback(() => {
    setGameState(prev => {
      let nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      
      // Skip inactive or kicked players
      while (
        prev.players[nextIndex].status === 'inactive' || 
        prev.players[nextIndex].status === 'kicked'
      ) {
        nextIndex = (nextIndex + 1) % prev.players.length;
        
        // If we've looped through all players, they must all be inactive
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
  
  // Handle player's hit action
  const handleHit = useCallback(() => {
    setLastActionType('hit');
    
    // Slight delay to allow animation to start
    setTimeout(() => {
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex];
        
        if (currentPlayer.cards.length === 0) {
          return prev;
        }
        
        // Take the top card from player's deck
        const [playedCard, ...remainingCards] = currentPlayer.cards;
        
        // Check if the played card matches the top card on the table
        const isMatch = checkCardMatch(playedCard, prev.tableCards);
        
        const updatedPlayers = [...prev.players];
        
        if (isMatch && prev.tableCards.length > 0) {
          // If match, player captures all cards on the table
          displayMessage('Cards matched!', 'success');
          setLastActionType('capture');
          
          updatedPlayers[prev.currentPlayerIndex] = {
            ...currentPlayer,
            cards: [...remainingCards, ...prev.tableCards, playedCard],
          };
          
          // Check if any player has no cards after this move
          if (remainingCards.length === 0) {
            // Game is over, current player loses
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
          // No match, card goes to the table
          updatedPlayers[prev.currentPlayerIndex] = {
            ...currentPlayer,
            cards: remainingCards,
          };
          
          // Check if player has no more cards
          if (remainingCards.length === 0) {
            updatedPlayers[prev.currentPlayerIndex].status = 'inactive';
            displayMessage(`${currentPlayer.name} is out of cards!`, 'warning');
            
            // Check if only one player is left with cards
            const activePlayers = updatedPlayers.filter(
              p => p.status === 'active' && p.cards.length > 0
            );
            
            if (activePlayers.length === 1) {
              // Game over, last player with cards wins
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
          
          // Continue game
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
      
      // Reset action type after a delay
      setTimeout(() => {
        setLastActionType('none');
      }, 500);
    }, 100);
  }, []);
  
  // Get the next active player index
  const getNextPlayerIndex = (players: Player[], currentIndex: number) => {
    let nextIndex = (currentIndex + 1) % players.length;
    
    while (
      players[nextIndex].status !== 'active' || 
      players[nextIndex].cards.length === 0
    ) {
      nextIndex = (nextIndex + 1) % players.length;
      
      // If we've checked all players and none are active, return the current one
      if (nextIndex === currentIndex) {
        return currentIndex;
      }
    }
    
    return nextIndex;
  };
  
  // Handle auto-play on timer expiration
  const handleAutoPlay = useCallback(() => {
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const updatedPlayers = [...prev.players];
      
      // Increment auto-play count
      const newAutoPlayCount = currentPlayer.autoPlayCount + 1;
      
      // Update player status if they've had too many auto-plays
      if (newAutoPlayCount >= 2) {
        updatedPlayers[prev.currentPlayerIndex] = {
          ...currentPlayer,
          status: 'kicked',
          autoPlayCount: newAutoPlayCount,
        };
        
        displayMessage(`${currentPlayer.name} kicked for inactivity!`, 'error');
        
        // Check if only one player remains active
        const activePlayers = updatedPlayers.filter(p => p.status === 'active');
        
        if (activePlayers.length === 1) {
          // Last active player wins
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
      
      // Process the auto-play (play the top card)
      if (currentPlayer.cards.length > 0) {
        const [playedCard, ...remainingCards] = currentPlayer.cards;
        
        updatedPlayers[prev.currentPlayerIndex] = {
          ...updatedPlayers[prev.currentPlayerIndex],
          cards: remainingCards,
        };
        
        // Check if played card matches the top card on the table
        const isMatch = checkCardMatch(playedCard, prev.tableCards);
        
        if (isMatch && prev.tableCards.length > 0) {
          // Match - player captures cards
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
          // No match - card goes to table
          return {
            ...prev,
            players: updatedPlayers,
            tableCards: [...prev.tableCards, playedCard],
            currentPlayerIndex: getNextPlayerIndex(updatedPlayers, prev.currentPlayerIndex),
            turnStartTime: Date.now(),
          };
        }
      }
      
      // No cards left for this player
      return {
        ...prev,
        players: updatedPlayers.map((p, i) => 
          i === prev.currentPlayerIndex ? { ...p, status: 'inactive' } : p
        ),
        currentPlayerIndex: getNextPlayerIndex(updatedPlayers, prev.currentPlayerIndex),
        turnStartTime: Date.now(),
      };
    });
  }, []);
  
  // Handle player's shuffle action
  const handleShuffle = useCallback(() => {
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      
      if (currentPlayer.shufflesRemaining <= 0) {
        return prev;
      }
      
      // Shuffle the player's cards
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
  }, []);
  
  // Handle play again
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
  
  // Timer effects
  useEffect(() => {
    if (gameState.status !== 'playing' || !gameActive) return;
    
    const timer = setInterval(() => {
      const elapsedTurnTime = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
      const remainingTurnTime = Math.max(0, TURN_TIME_LIMIT - elapsedTurnTime);
      
      setTimeRemaining(remainingTurnTime);
      
      if (remainingTurnTime === 0) {
        handleAutoPlay();
      }
      
      // Game timer
      const elapsedGameTime = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
      const remainingGameTime = Math.max(0, GAME_TIME_LIMIT - elapsedGameTime);
      
      setGameTimeRemaining(remainingGameTime);
      
      if (remainingGameTime === 0 && gameState.status === 'playing') {
        // End game due to time limit
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
  }, [gameState.status, gameState.turnStartTime, gameState.gameStartTime, handleAutoPlay, gameActive, displayMessage]);
  
  // Update message when current player changes
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
  
  // Render appropriate screen based on game state
  if (gameState.status === 'setup') {
    return <SetupScreen onStartGame={startGame} />;
  }
  
  if (gameState.status === 'finished' && gameState.winner) {
    return (
      <>
        <Confetti isActive={true} />
        <GameOverScreen 
          winner={gameState.winner} 
          players={gameState.players}
          onPlayAgain={handlePlayAgain} 
        />
      </>
    );
  }
  
  // Determine player positions based on number of players
  const getPlayerPositions = () => {
    const positions = ['top', 'right', 'bottom', 'left'];
    const playerPositions: Record<string, string> = {};
    
    gameState.players.forEach((player, index) => {
      const position = positions[index % positions.length];
      playerPositions[player.id] = position;
    });
    
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
      
      <div className="bg-casino p-4 rounded-lg shadow-lg border border-casino-table mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-casino-gold">Card Table Blitz</h1>
          <div className="text-sm text-gray-400">
            Game time: {Math.floor(gameTimeRemaining / 60)}:{(gameTimeRemaining % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
      
      {/* Game table with players positioned around it */}
      <div className="relative h-[600px] bg-casino-dark rounded-xl overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5">
          <GameTable cards={gameState.tableCards} orientation={orientation} />
        </div>
        
        {/* Players positioned around the table */}
        {gameState.players.map((player, index) => {
          const position = playerPositions[player.id];
          const isCurrentPlayer = index === gameState.currentPlayerIndex;
          
          // Calculate position classes
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
          
          return (
            <div 
              key={player.id} 
              className={`absolute ${positionClass}`}
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
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Game;
