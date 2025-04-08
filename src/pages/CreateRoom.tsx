import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Dice1, Loader2 } from 'lucide-react';

const CreateRoom = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const generateRoomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateRoom = async () => {
    if (!user) {
      setError('You must be logged in to create a room');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let roomCode;
      let existingRoom;
      let attempts = 0;
      const maxAttempts = 3;

      // Try to generate a unique room code
      do {
        roomCode = generateRoomCode();
        const { data, error } = await supabase
          .from('rooms')
          .select('id')
          .eq('code', roomCode)
          .maybeSingle();

        if (error) {
          console.error('Error checking room code:', error);
          throw new Error('Failed to create room. Please try again.');
        }

        existingRoom = data;
        attempts++;
      } while (existingRoom && attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique room code. Please try again.');
      }

      // Create the room with the unique code
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          created_by: user.id,
          current_turn: user.id,
          status: 'waiting',
          code: roomCode,
        })
        .select()
        .single();

      if (roomError) {
        console.error('Room creation error:', roomError);
        throw new Error('Failed to create room. Please try again.');
      }

      if (!room) {
        throw new Error('Failed to create room. Please try again.');
      }

      // Join as the first player
      const { error: joinError } = await supabase
        .from('moves')
        .insert({
          room_id: room.id,
          player_id: user.id,
          card_played: 'join',
          position: 0,
        });

      if (joinError) {
        console.error('Join error:', joinError);
        throw new Error('Failed to join room');
      }

      // Ensure the user's profile exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.email?.split('@')[0] || 'Player 1',
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      navigate(`/room/${room.id}`);
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err instanceof Error ? err.message : 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-block mb-4"
            >
              <Dice1 className="h-16 w-16 text-casino-gold" />
            </motion.div>
            <motion.h2 
              className="text-3xl font-bold text-casino-gold mb-3"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              Create Room
            </motion.h2>
            <p className="text-casino-light text-lg">
              Start a new game room and invite friends
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full bg-casino-gold hover:bg-casino-gold/90 text-black font-semibold text-lg py-6 relative"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Room...
                </span>
              ) : (
                'Create New Room'
              )}
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full border-casino-gold text-casino-gold hover:bg-casino-gold/10"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateRoom; 