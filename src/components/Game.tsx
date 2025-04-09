import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Card, createDeck, shuffleDeck, generatePlayerColors, GameState as GameStateType, CardSuit, CardRank } from '../models/game';
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
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '../lib/database.types';
import { User } from '@supabase/auth-helpers-nextjs';

const TURN_TIME_LIMIT = 10; // seconds
const GAME_TIME_LIMIT = 120; // seconds (2 minutes)
const ANIMATION_DURATION = 800; // milliseconds

interface GamePlayer {
  id: string;
  username: string;
  cards: number;
  status: 'active' | 'inactive';
  shufflesRemaining: number;
  autoPlayCount: number;
  avatarColor: string;
  score: number;
}

interface TableCard {
  playerId: string;
  card: number;
  position: number;
}

interface GameState {
  players: GamePlayer[];
  tableCards: TableCard[];
  myCards: number[];
  currentTurn: string;
  gamePhase: 'shuffling' | 'distributing' | 'playing';
  currentCardIndex: number;
  totalCards: number;
  shuffleProgress: number;
  showShuffleAnimation: boolean;
}

interface GameProps {
  roomId: string;
  isHost: boolean;
  onGameComplete?: () => void;
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
      score: 0
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

export function Game({ roomId, isHost, onGameComplete }: GameProps) {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    tableCards: [],
    myCards: [],
    currentTurn: '',
    gamePhase: 'shuffling',
    currentCardIndex: 0,
    totalCards: 0,
    shuffleProgress: 0,
    showShuffleAnimation: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useState(() => supabase.auth.getUser());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [room, setRoom] = useState<any | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    fetchGameState();
    const subscription = supabase
      .channel('game_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'moves',
        filter: `room_id=eq.${roomId}`
      }, () => {
        fetchGameState();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  const fetchGameState = async () => {
    try {
      // First get all moves in the room
      const { data: movesData, error: movesError } = await supabase
        .from('moves')
        .select('*')
        .eq('room_id', roomId);

      if (movesError) throw movesError;

      // Get unique player IDs
      const playerIds = [...new Set(movesData.map(move => move.player_id))];

      // Fetch player profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', playerIds);

      if (profilesError) throw profilesError;

      // Get room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      const state = processMovesToGameState(movesData, profilesData || [], currentUser?.id);
      state.currentTurn = roomData.current_turn;
      setGameState(state);
      setRoom(roomData);
    } catch (err) {
      console.error('Error fetching game state:', err);
      setError('Failed to fetch game state');
    } finally {
      setLoading(false);
    }
  };

  const processMovesToGameState = (moves: any[], players: any[], userId: string | undefined): GameState => {
    return {
      players: players.map(p => ({
        id: p.id,
        username: p.username,
        cards: moves.filter(m => m.player_id === p.id && m.position === -1).length,
        status: 'active',
        shufflesRemaining: 1,
        autoPlayCount: 0,
        avatarColor: generatePlayerColors(players.length)[players.indexOf(p)],
        score: 0
      })),
      tableCards: moves
        .filter(m => m.position >= 0)
        .map(m => ({
          playerId: m.player_id,
          card: parseInt(m.card_played),
          position: m.position
        })),
      myCards: moves
        .filter(m => m.player_id === userId && m.position === -1)
        .map(m => parseInt(m.card_played)),
      currentTurn: '',
      gamePhase: 'shuffling',
      currentCardIndex: 0,
      totalCards: 0,
      shuffleProgress: 0,
      showShuffleAnimation: true
    };
  };

  const playCard = async (cardIndex: number) => {
    const userData = await user;
    if (!userData.data.user) return;
    
    if (gameState.currentTurn !== userData.data.user.id) {
      toast.error("It's not your turn!");
      return;
    }

    const cardToPlay = gameState.myCards[cardIndex];
    const nextPosition = gameState.tableCards.length;

    try {
      const { error: moveError } = await supabase
        .from('moves')
        .update({ position: nextPosition })
        .eq('room_id', roomId)
        .eq('player_id', userData.data.user.id)
        .eq('card_played', cardToPlay.toString());

      if (moveError) throw moveError;

      const currentPlayerIndex = gameState.players.findIndex(p => p.id === userData.data.user?.id);
      const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
      const nextPlayerId = gameState.players[nextPlayerIndex].id;

      const { error: updateError } = await supabase
        .from('rooms')
        .update({ current_turn: nextPlayerId })
        .eq('id', roomId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error playing card:', err);
      toast.error('Failed to play card');
    }
  };

  const startGame = async () => {
    try {
      // Create and shuffle deck
      const deck = shuffleDeck(createDeck());
      const totalCards = deck.length;
      const cardsPerPlayer = Math.floor(totalCards / gameState.players.length);
      
      // Start shuffling phase
      setGameState(prev => ({
        ...prev,
        gamePhase: 'shuffling',
        totalCards,
        currentCardIndex: 0,
        shuffleProgress: 0,
        showShuffleAnimation: true
      }));

      // Simulate shuffling progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setGameState(prev => ({
          ...prev,
          shuffleProgress: i
        }));
      }

      // Wait for shuffling animation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Start distributing cards
      setGameState(prev => ({
        ...prev,
        gamePhase: 'distributing',
        showShuffleAnimation: false
      }));

      // Simulate card distribution
      for (let i = 0; i < totalCards; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setGameState(prev => ({
          ...prev,
          currentCardIndex: i + 1
        }));
      }

      // Wait for distribution animation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Start playing phase
      setGameState(prev => ({
        ...prev,
        gamePhase: 'playing',
        myCards: deck.slice(0, cardsPerPlayer).map(card => parseInt(card.value)),
        currentTurn: gameState.players[0].id
      }));

    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start game');
    }
  };

  const handleStartGame = async () => {
    if (!isHost) {
      toast.error('Only the host can start the game');
      return;
    }

    try {
      // Update room status to playing
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ 
          status: 'playing',
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (roomError) throw roomError;

      // Start the game sequence
      await startGame();
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
    }
  };

  const handleGameComplete = async () => {
    try {
      // Call the onGameComplete callback if provided
      if (onGameComplete) {
        await onGameComplete();
      }
    } catch (error) {
      console.error('Error completing game:', error);
    }
  };

  if (loading) return <div>Loading game...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-casino-dark to-casino-darker p-4">
      <div className="max-w-6xl mx-auto">
        {gameState.gamePhase === 'shuffling' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <ShufflingState 
              shuffleProgress={gameState.shuffleProgress}
              showShuffleAnimation={gameState.showShuffleAnimation}
            />
            {isHost && (
              <Button
                onClick={handleStartGame}
                className="bg-casino-gold hover:bg-casino-gold/90 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-200"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            )}
          </div>
        )}

        {gameState.gamePhase === 'distributing' && (
          <DistributingState 
            players={gameState.players.map(p => ({
              id: p.id,
              name: p.username,
              cards: [],
              status: p.status,
              shufflesRemaining: p.shufflesRemaining,
              autoPlayCount: p.autoPlayCount,
              avatarColor: p.avatarColor,
              score: p.score
            }))}
            playerPositions={getPlayerPositions(gameState.players)}
            currentCardIndex={gameState.currentCardIndex}
            totalCards={gameState.totalCards}
          />
        )}

        {gameState.gamePhase === 'playing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Player Areas */}
            <div className="space-y-8">
              {gameState.players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-xl ${
                    player.id === gameState.currentTurn
                      ? 'bg-casino-gold/20 border-2 border-casino-gold'
                      : 'bg-casino-darker/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-casino-gold">
                      {player.username}
                      {player.id === room?.created_by && (
                        <span className="ml-2 text-sm text-casino-light">(Host)</span>
                      )}
                    </h3>
                    <div className="text-casino-light">
                      Cards: {player.cards}
                    </div>
                  </div>
                  {player.id === currentUser?.id && (
                    <div className="flex flex-wrap gap-2">
                      {gameState.myCards.map((card, cardIndex) => (
                        <motion.div
                          key={cardIndex}
                          whileHover={{ y: -10 }}
                          className="w-16 h-24 bg-white rounded-lg shadow-lg cursor-pointer"
                          onClick={() => playCard(cardIndex)}
                        >
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                            {card}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Game Table */}
            <div className="bg-casino-darker/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-casino-gold mb-4">Table</h3>
              <div className="min-h-[300px] bg-casino-dark/30 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4">
                  {gameState.tableCards.map((card, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-16 h-24 bg-white rounded-lg shadow-lg"
                    >
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                        {card.card}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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

// Helper function to get player positions
const getPlayerPositions = (players: GamePlayer[]) => {
  const positions: Record<string, string> = {};
  const positionsList = ['bottom', 'left', 'top', 'right'];
  
  players.forEach((player, index) => {
    positions[player.id] = positionsList[index % positionsList.length];
  });
  
  return positions;
};

export default Game;
