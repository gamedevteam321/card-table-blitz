import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Copy, Share2 } from 'lucide-react';

interface Room {
  id: string;
  created_by: string;
  current_turn: string | null;
  status: 'waiting' | 'playing' | 'completed';
}

const Lobby = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  const createRoom = async () => {
    if (!user) {
      setError('You must be logged in to create a room');
      return;
    }

    try {
      const { data: room, error } = await supabase
        .from('rooms')
        .insert([
          { 
            created_by: user.id,
            current_turn: user.id,
            status: 'waiting'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Room creation error:', error);
        setError('Failed to create room. Please try again.');
        return;
      }

      if (!room) {
        setError('Failed to create room. Please try again.');
        return;
      }

      // Create the first player entry
      const { error: playerError } = await supabase
        .from('players')
        .insert([
          {
            room_id: room.id,
            user_id: user.id,
            name: user.email || 'Player 1'
          }
        ]);

      if (playerError) {
        console.error('Player creation error:', playerError);
        setError('Failed to join room. Please try again.');
        return;
      }

      navigate(`/room/${room.id}`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const joinRoom = async () => {
    if (!roomId) {
      setError('Please enter a room ID');
      return;
    }

    if (!user) {
      setError('You must be logged in to join a room');
      return;
    }

    try {
      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error || !room) {
        setError('Room not found');
        return;
      }

      // Check if player already exists in the room
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      if (!existingPlayer) {
        // Add player to the room
        const { error: playerError } = await supabase
          .from('players')
          .insert([
            {
              room_id: roomId,
              user_id: user.id,
              name: user.email || 'Player 2'
            }
          ]);

        if (playerError) {
          console.error('Player join error:', playerError);
          setError('Failed to join room. Please try again.');
          return;
        }
      }

      navigate(`/room/${roomId}`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const copyRoomLink = () => {
    if (roomId) {
      navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-casino-dark text-white p-4">
      <div className="max-w-md mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-casino-darker p-8 rounded-lg"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-casino-gold">
            Game Lobby
          </h2>

          <div className="space-y-6">
            <Button
              onClick={createRoom}
              className="w-full bg-casino-gold hover:bg-casino-gold/90"
            >
              Create New Room
            </Button>

            <div className="relative">
              <Input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full"
              />
              {roomId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyRoomLink}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showCopied ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </div>

            <Button
              onClick={joinRoom}
              className="w-full"
              variant="outline"
            >
              Join Room
            </Button>

            {error && (
              <p className="text-red-500 text-center">{error}</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Lobby; 