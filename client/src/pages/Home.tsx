import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-casino-dark to-casino-darker flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-casino-gold mb-6">
          Patte pe Patta
        </h1>
        <p className="text-xl text-casino-light mb-8">
          Fast-paced multiplayer card game
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-casino-dark/50 p-8 rounded-xl shadow-2xl backdrop-blur-sm max-w-md w-full"
      >
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-casino-gold mb-2">
              Quick Play
            </h2>
            <p className="text-casino-light mb-4">
              Join a game or create your own room
            </p>
          </div>

          <div className="space-y-4">
            <Link to="/create-room" className="block">
              <Button className="w-full bg-casino-green hover:bg-casino-green/90 text-white">
                Create Room
              </Button>
            </Link>
            <Link to="/join-room" className="block">
              <Button className="w-full bg-casino-blue hover:bg-casino-blue/90 text-white">
                Join Room
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home; 