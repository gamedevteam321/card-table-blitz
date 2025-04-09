import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Game from '@/components/Game';
import { Button } from '@/components/ui/button';
import { Users, Copy, Share2, Check, Clock } from 'lucide-react';
import { shuffle } from '@/lib/utils';

interface Player {
  id: string;
  username: string;
  avatar_url?: string;
  is_ready?: boolean;
}

interface Room {
  id: string;
  code: string;
  created_by: string;
  current_turn: string;
  status: 'waiting' | 'playing' | 'completed';
  creator_profile?: {
    username: string;
  };
  amount_stack: number;
  max_players: number;
  waiting_time: number;
}

interface PlayerReadiness {
  player_id: string;
  is_ready: boolean;
  room_id: string;
}

interface Move {
  id: string;
  room_id: string;
  player_id: string;
  card_played: string;
  created_at: string;
}

const CARDS_PER_PLAYER = 5;

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setError('Invalid room ID');
      return;
    }

    fetchRoomData();
    const cleanup = setupRoomSubscription();

    return () => {
      cleanup();
    };
  }, [roomId]);

  useEffect(() => {
    if (room?.status === 'waiting' && room.waiting_time) {
      setTimeLeft(room.waiting_time);
    }
  }, [room]);

  useEffect(() => {
    if (room?.waiting_time && !gameStarted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Start game when timer expires
            startGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [room?.waiting_time, gameStarted]);

  // Add new effect to check for all players being ready
  useEffect(() => {
    if (!gameStarted && players.length > 0) {
      const allReady = players.every(player => player.is_ready);
      if (allReady) {
        startGame();
      }
    }
  }, [players, gameStarted]);

  const fetchRoomData = async () => {
    try {
      // First fetch room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Then fetch the creator's profile
      const { data: creatorProfile, error: creatorError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', roomData.created_by)
        .single();

      if (creatorError) {
        console.error('Error fetching creator profile:', creatorError);
      }

      setRoom({
        ...roomData,
        creator_profile: creatorProfile || { username: 'Unknown' }
      });

      // Fetch players in the room
      const { data: movesData, error: movesError } = await supabase
        .from('moves')
        .select('player_id')
        .eq('room_id', roomId)
        .eq('card_played', 'join');

      if (movesError) throw movesError;

      // Get unique player IDs
      const playerIds = [...new Set(movesData.map(move => move.player_id))];

      // Fetch player profiles and readiness
      const { data: playerProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', playerIds);

      if (profilesError) throw profilesError;

      // Fetch player readiness
      const { data: readinessData, error: readinessError } = await supabase
        .from('player_readiness')
        .select('player_id, is_ready')
        .eq('room_id', roomId);

      if (readinessError) throw readinessError;

      // Combine player profiles with readiness
      const playersWithReadiness = playerProfiles.map(profile => ({
        ...profile,
        is_ready: readinessData.find(r => r.player_id === profile.id)?.is_ready || false
      }));

      setPlayers(playersWithReadiness);

      // Check if current user is ready
      const userReadiness = readinessData.find(r => r.player_id === user?.id);
      setIsReady(userReadiness?.is_ready || false);

    } catch (err) {
      console.error('Error fetching room data:', err);
      setError('Failed to load room data');
    } finally {
      setLoading(false);
    }
  };

  const setupRoomSubscription = () => {
    // Subscribe to room changes
    const roomSubscription = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('Room change:', payload);
          if (payload.eventType === 'UPDATE') {
            const updatedRoom = payload.new as Room;
            setRoom(updatedRoom);
            
            // If game started, set gameStarted to true
            if (updatedRoom.status === 'playing') {
              setGameStarted(true);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to player readiness changes
    const readinessSubscription = supabase
      .channel(`readiness:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_readiness',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('Readiness change:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const readiness = payload.new as PlayerReadiness;
            setPlayers(prev => {
              const updated = [...prev];
              const index = updated.findIndex(p => p.id === readiness.player_id);
              if (index !== -1) {
                updated[index] = { ...updated[index], is_ready: readiness.is_ready };
              }
              return updated;
            });
          }
        }
      )
      .subscribe();

    // Subscribe to moves table for player join events
    const movesSubscription = supabase
      .channel(`moves:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moves',
          filter: `room_id=eq.${roomId} AND card_played=eq.join`,
        },
        async (payload) => {
          console.log('New player joined:', payload);
          const move = payload.new as Move;
          
          // Fetch the new player's profile
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', move.player_id)
            .single();

          if (error) {
            console.error('Error fetching player profile:', error);
            return;
          }

          // Add new player to the list if they don't exist
          setPlayers(prev => {
            const playerExists = prev.some(p => p.id === profile.id);
            if (!playerExists) {
              return [...prev, {
                id: profile.id,
                username: profile.username,
                is_ready: false,
                is_host: profile.id === room?.created_by
              }];
            }
            return prev;
          });
        }
      )
      .subscribe();

    // Subscribe to player leave events
    const leaveSubscription = supabase
      .channel(`leaves:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moves',
          filter: `room_id=eq.${roomId} AND card_played=eq.leave`,
        },
        async (payload) => {
          console.log('Player left:', payload);
          const move = payload.new as Move;
          
          // Remove player from the list
          setPlayers(prev => prev.filter(p => p.id !== move.player_id));
        }
      )
      .subscribe();

    return () => {
      roomSubscription.unsubscribe();
      readinessSubscription.unsubscribe();
      movesSubscription.unsubscribe();
      leaveSubscription.unsubscribe();
    };
  };

  const handleReadyToggle = async () => {
    if (!user || !roomId) return;

    try {
      const { error } = await supabase
        .from('player_readiness')
        .upsert({
          room_id: roomId,
          player_id: user.id,
          is_ready: !isReady
        });

      if (error) throw error;
      setIsReady(!isReady);
    } catch (err) {
      console.error('Error updating readiness:', err);
      setError('Failed to update readiness status');
    }
  };

  const startGame = async () => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'in_progress' })
        .eq('id', roomId);

      if (error) throw error;

      setGameStarted(true);
      setTimeLeft(0);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-casino-dark flex items-center justify-center">
        <div className="text-casino-gold text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-casino-dark flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  // If game has started, render the Game component
  if (gameStarted) {
    return <Game roomId={roomId!} isHost={room?.created_by === user?.id} />;
  }

  return (
    <div className="min-h-screen bg-casino-dark p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-casino-dark/50 border border-casino-gold/30 rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-casino-gold">Room {room?.code}</h1>
              <p className="text-casino-light">
                Created by {room?.creator_profile?.username}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShowCopied(true);
                  setTimeout(() => setShowCopied(false), 2000);
                }}
                className="text-casino-gold border-casino-gold/50 hover:bg-casino-gold/10"
              >
                {showCopied ? 'Copied!' : <Copy className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.share({
                    title: 'Join my game room',
                    text: 'Join my game room',
                    url: window.location.href,
                  });
                }}
                className="text-casino-gold border-casino-gold/50 hover:bg-casino-gold/10"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-casino-gold">Players</h2>
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-casino-dark/30 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-casino-gold" />
                      <span className="text-white">{player.username}</span>
                    </div>
                    {player.is_ready && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-casino-gold">Game Settings</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-casino-dark/30 p-3 rounded-lg">
                  <span className="text-white">Stack Amount</span>
                  <span className="text-casino-gold">{room?.amount_stack}</span>
                </div>
                <div className="flex justify-between items-center bg-casino-dark/30 p-3 rounded-lg">
                  <span className="text-white">Max Players</span>
                  <span className="text-casino-gold">{room?.max_players}</span>
                </div>
                <div className="flex justify-between items-center bg-casino-dark/30 p-3 rounded-lg">
                  <span className="text-white">Time Remaining</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-casino-gold" />
                    <span className="text-casino-gold">
                      {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleReadyToggle}
              className={`px-8 py-3 text-lg ${
                isReady
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-casino-gold hover:bg-casino-gold/90'
              }`}
            >
              {isReady ? 'Not Ready' : 'Ready'}
            </Button>
          </div>

          {room?.created_by === user?.id && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={startGame}
                disabled={!players.every(p => p.is_ready)}
                className="px-8 py-3 text-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Game
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Room; 