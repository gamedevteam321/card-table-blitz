import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Game from '@/components/Game';
import { Button } from '@/components/ui/button';
import { Users, Copy, Share2 } from 'lucide-react';
import { shuffle } from '@/lib/utils';

interface Player {
  id: string;
  username: string;
  avatar_url?: string;
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

      if (playerIds.length > 0) {
        // Fetch player profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', playerIds);

        if (profilesError) throw profilesError;
        setPlayers(profilesData || []);
      } else {
        setPlayers([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError('Failed to load room data');
      setLoading(false);
    }
  };

  const setupRoomSubscription = () => {
    // Subscribe to moves table for player joins
    const movesChannel = supabase.channel(`room:${roomId}:moves`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'moves',
        filter: `room_id=eq.${roomId}`,
      }, async (payload) => {
        console.log('Moves update:', payload);
        // Fetch updated room data
        await fetchRoomData();
      })
      .subscribe();

    // Subscribe to rooms table for game start
    const roomsChannel = supabase.channel(`room:${roomId}:status`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      }, async (payload) => {
        console.log('Room status update:', payload);
        const newStatus = payload.new.status;
        
        // If game has started, refresh the page to enter game mode
        if (newStatus === 'playing') {
          window.location.reload();
        } else {
          // For other updates, just refresh the room data
          await fetchRoomData();
        }
      })
      .subscribe();

    return () => {
      movesChannel.unsubscribe();
      roomsChannel.unsubscribe();
    };
  };

  const handleStartGame = async () => {
    if (!user || !room || user.id !== room.created_by) {
      setError('Only the room creator can start the game');
      return;
    }

    if (players.length < 2) {
      setError('Need at least 2 players to start');
      return;
    }

    try {
      setLoading(true);
      
      // Generate and shuffle deck
      const deck = Array.from({ length: 52 }, (_, i) => i);
      const shuffledDeck = shuffle(deck);

      // Deal cards to players
      const playerMoves = players.flatMap((player, playerIndex) => {
        const startIndex = playerIndex * CARDS_PER_PLAYER;
        const playerCards = shuffledDeck.slice(startIndex, startIndex + CARDS_PER_PLAYER);
        
        return playerCards.map((card, cardIndex) => ({
          room_id: roomId,
          player_id: player.id,
          card_played: card.toString(),
          position: -1, // -1 indicates card in hand
        }));
      });

      // First update room status to playing
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ 
          status: 'playing',
          current_turn: players[0].id,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (updateError) {
        console.error('Error updating room status:', updateError);
        throw updateError;
      }

      // Then insert all moves at once
      const { error: dealsError } = await supabase
        .from('moves')
        .insert(playerMoves);

      if (dealsError) {
        console.error('Error dealing cards:', dealsError);
        throw dealsError;
      }

      // The real-time subscription will handle the page refresh
      // when it receives the room status update
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      // Remove player from moves table
      const { error } = await supabase
        .from('moves')
        .delete()
        .eq('room_id', roomId)
        .eq('player_id', user?.id);

      if (error) throw error;

      // If no players left and current user is creator, delete the room
      if (room?.created_by === user?.id) {
        const { data: remainingPlayers } = await supabase
          .from('moves')
          .select('player_id')
          .eq('room_id', roomId)
          .eq('card_played', 'join');

        if (!remainingPlayers?.length) {
          await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId);
        }
      }

      navigate('/');
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave room');
    }
  };

  const handleShareRoom = async () => {
    if (!room?.code) return;

    const shareText = `Join my game room with code: ${room.code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my game room',
          text: shareText,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-casino-dark to-casino-darker flex items-center justify-center">
        <div className="text-casino-gold text-xl">Loading room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-casino-dark to-casino-darker flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-casino-dark to-casino-darker flex items-center justify-center">
        <div className="text-casino-gold text-xl">Room not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-casino-dark to-casino-darker">
      {room.status === 'waiting' ? (
        <div className="container mx-auto p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-casino-dark/50 p-8 rounded-xl shadow-2xl backdrop-blur-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-casino-gold mb-2">
                  Room Code: {room.code}
                </h2>
                <p className="text-casino-light text-sm">
                  Host: {room.creator_profile?.username || 'Unknown'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShareRoom}
                  className="text-casino-gold hover:text-casino-gold/80"
                >
                  {showCopied ? <Copy className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                </Button>
                <Button
                  onClick={handleLeaveRoom}
                  variant="outline"
                  className="border-casino-gold text-casino-gold hover:bg-casino-gold/10"
                >
                  Leave Room
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl text-casino-light mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players ({players.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {players.map((player) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-casino-darker p-4 rounded-lg border border-casino-gold/20"
                  >
                    <p className="text-casino-gold">{player.username}</p>
                    {player.id === room.created_by && (
                      <span className="text-sm text-casino-light">(Host)</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {players.length < 2 ? (
              <div className="bg-casino-darker/50 p-4 rounded-lg text-center text-casino-light">
                Waiting for more players...
              </div>
            ) : user?.id === room.created_by && (
              <Button
                onClick={handleStartGame}
                className="w-full bg-casino-gold hover:bg-casino-gold/90 text-black font-semibold text-lg py-6"
              >
                Start Game
              </Button>
            )}
          </motion.div>
        </div>
      ) : (
        <Game
          roomId={roomId!}
          isHost={user?.id === room.created_by}
        />
      )}
    </div>
  );
};

export default Room; 