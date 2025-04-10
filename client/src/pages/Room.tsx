import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Game from '@/components/Game';
import { Button } from '@/components/ui/button';
import { Users, Copy, Share2, Check, Clock } from 'lucide-react';
import { shuffle } from '@/lib/utils';
import { Room, RoomMessage, RoomParticipant } from '../types';

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
  const { socket } = useSocket();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    // Join room
    socket.emit('room:join', roomId);

    // Listen for room updates
    socket.on('room:user_joined', (data: { userId: string }) => {
      setParticipants((prev) => [...prev, { user_id: data.userId } as RoomParticipant]);
    });

    socket.on('room:user_left', (data: { userId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.user_id !== data.userId));
    });

    socket.on('room:new_message', (message: RoomMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('room:participants', (participants: RoomParticipant[]) => {
      setParticipants(participants);
    });

    // Fetch room details
    fetchRoomDetails();

    return () => {
      socket.off('room:user_joined');
      socket.off('room:user_left');
      socket.off('room:new_message');
      socket.off('room:participants');
    };
  }, [socket, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        .update({ 
          status: 'playing',
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;

      setGameStarted(true);
      setTimeLeft(0);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const endGame = async () => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.id}`,
          },
        }
      );
      const data = await response.json();
      setRoom(data);
    } catch (err) {
      setError('Failed to fetch room details');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !roomId) return;

    socket.emit('room:message', {
      roomId,
      message: newMessage.trim(),
    });
    setNewMessage('');
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
    return <Game 
      roomId={roomId!} 
      isHost={room?.created_by === user?.id} 
      onGameComplete={endGame}
    />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">{room?.name}</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Chat</h2>
                <div className="h-96 overflow-y-auto mb-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.user_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-4 py-2 ${
                          message.user_id === user?.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Room Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Game Type</p>
                  <p className="text-lg font-medium text-gray-900">
                    {room?.game_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Room Type</p>
                  <p className="text-lg font-medium text-gray-900">
                    {room?.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stake Value</p>
                  <p className="text-lg font-medium text-gray-900">
                    ${room?.stake_value}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Players</p>
                  <p className="text-lg font-medium text-gray-900">
                    {participants.length}/{room?.max_players}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Participants
                </h3>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.user_id}
                      className="flex items-center space-x-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-900">
                        {participant.user_id === user?.id
                          ? 'You'
                          : `Player ${participant.user_id.slice(0, 4)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Room; 