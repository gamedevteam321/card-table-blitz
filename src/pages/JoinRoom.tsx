import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Share2, Copy, Users } from 'lucide-react';

interface Room {
  id: string;
  code: string;
  created_by: string;
  status: 'waiting' | 'playing' | 'completed';
  created_at: string;
  creator_profile: {
    username: string;
  };
  playerCount: number;
}

interface RoomResponse {
  id: string;
  code: string;
  created_by: string;
  status: 'waiting' | 'playing' | 'completed';
  created_at: string;
  creator_profile: {
    username: string;
  };
}

const JoinRoom = () => {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [showCopied, setShowCopied] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchAvailableRooms();
    const interval = setInterval(fetchAvailableRooms, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAvailableRooms = async () => {
    try {
      setLoading(true);
      
      // First, clean up inactive rooms
      const { error: cleanupError } = await supabase
        .from('rooms')
        .delete()
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .eq('status', 'waiting');

      if (cleanupError) {
        console.error('Error cleaning up inactive rooms:', cleanupError);
      }

      // Fetch active rooms that are in waiting state
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, code, created_by, status, created_at')
        .eq('status', 'waiting')
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (roomsError) throw roomsError;

      if (!rooms?.length) {
        setAvailableRooms([]);
        return;
      }

      // Get creator profiles
      const creatorIds = [...new Set(rooms.map(room => room.created_by))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', creatorIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Get player counts for each room
      const roomIds = rooms.map(room => room.id);
      const { data: playerCounts, error: countError } = await supabase
        .from('moves')
        .select('room_id')
        .in('room_id', roomIds)
        .eq('card_played', 'join');

      if (countError) {
        console.error('Error fetching player counts:', countError);
      }

      // Count players per room
      const playerCountMap = playerCounts?.reduce((acc, move) => {
        acc[move.room_id] = (acc[move.room_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Map rooms with profiles and player counts
      const roomsWithDetails: Room[] = rooms.map(room => ({
        id: room.id,
        code: room.code,
        created_by: room.created_by,
        status: room.status,
        created_at: room.created_at,
        creator_profile: {
          username: profiles?.find(p => p.id === room.created_by)?.username || 'Unknown'
        },
        playerCount: playerCountMap[room.id] || 0
      }));

      setAvailableRooms(roomsWithDetails);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load available rooms');
    } finally {
      setLoading(false);
    }
  };

  const formatUsername = (email: string) => {
    return email.split('@')[0];
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!user) {
      setError('You must be logged in to join a room');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if room exists and is in waiting state
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .eq('status', 'waiting')
        .single();

      if (roomError) {
        console.error('Room error:', roomError);
        throw new Error('Failed to check room status');
      }

      if (!room) {
        throw new Error('Room not found or not available');
      }

      // Join the room
      const { error: joinError } = await supabase
        .from('moves')
        .insert([
          {
            room_id: room.id,
            player_id: user.id,
            card_played: 'join',
            position: 0,
          },
        ]);

      if (joinError) {
        console.error('Join error:', joinError);
        throw new Error('Failed to join room');
      }

      // Ensure the user's profile exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.email?.split('@')[0] || 'Player',
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      navigate(`/room/${room.id}`);
    } catch (err) {
      console.error('Error joining room:', err);
      setError(err instanceof Error ? err.message : 'Failed to join room. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareRoom = async () => {
    if (!roomCode) return;

    const shareText = `Join my game room with code: ${roomCode}`;

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-casino-dark to-casino-darker flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-casino-dark/50 p-8 rounded-xl shadow-2xl backdrop-blur-sm max-w-md w-full"
      >
        <div className="space-y-8">
          <div className="text-center">
            <motion.h2 className="text-3xl font-bold text-casino-gold mb-3">
              Join Room
            </motion.h2>
            <p className="text-casino-light text-lg">
              Enter a room code or select from available rooms
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-casino-light mb-2">Room Code</label>
              <Input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full bg-casino-darker border-casino-gold/20 text-casino-light"
              />
            </div>

            <Button
              onClick={() => handleJoinRoom(roomCode)}
              disabled={loading || !roomCode}
              className="w-full bg-casino-gold hover:bg-casino-gold/90 text-black font-semibold text-lg py-6"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </Button>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl text-casino-light mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Rooms
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {availableRooms.map((room) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-casino-darker p-4 rounded-lg border border-casino-gold/20"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-casino-gold">Room {room.code}</p>
                      <p className="text-sm text-casino-light">
                        Created by {room.creator_profile?.username || 'Unknown'}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={loading}
                      className="bg-casino-gold hover:bg-casino-gold/90 text-black"
                    >
                      Join
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JoinRoom; 