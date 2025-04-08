import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showGameIntro, setShowGameIntro] = useState(false);

  return (
    <div className="min-h-screen bg-casino-dark text-white">
      {/* Header */}
      <header className="bg-casino-darker py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-casino-gold">Patte pe Patta</h1>
        <div className="flex gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-casino-gold">Welcome, {user.email}</span>
              <Button variant="outline" onClick={() => navigate('/lobby')}>
                Play Now
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <motion.h2 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Welcome to Patte pe Patta
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            A fast-paced card game for friends and family
          </motion.p>
          
          {!showGameIntro ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button 
                size="lg" 
                onClick={() => setShowGameIntro(true)}
                className="bg-casino-gold hover:bg-casino-gold/90"
              >
                Learn How to Play
              </Button>
            </motion.div>
          ) : (
            <motion.div
              className="max-w-2xl mx-auto bg-casino-darker p-8 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold mb-4 text-casino-gold">How to Play</h3>
              <div className="space-y-4 text-left">
                <p>1. Create or join a game room</p>
                <p>2. Invite friends using the room link</p>
                <p>3. Each player gets a hand of cards</p>
                <p>4. Take turns playing cards to capture or throw</p>
                <p>5. The player with the most cards at the end wins!</p>
              </div>
              <div className="mt-8 flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowGameIntro(false)}
                >
                  Back
                </Button>
                {user ? (
                  <Button 
                    onClick={() => navigate('/lobby')}
                    className="bg-casino-gold hover:bg-casino-gold/90"
                  >
                    Start Playing
                  </Button>
                ) : (
                  <Link to="/signup">
                    <Button className="bg-casino-gold hover:bg-casino-gold/90">
                      Sign Up to Play
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <motion.div 
            className="bg-casino-darker p-6 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3 className="text-xl font-bold mb-4 text-casino-gold">Play with Friends</h3>
            <p>Create private rooms and invite your friends to join the fun</p>
          </motion.div>
          <motion.div 
            className="bg-casino-darker p-6 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h3 className="text-xl font-bold mb-4 text-casino-gold">Real-time Gameplay</h3>
            <p>Experience smooth, real-time card animations and interactions</p>
          </motion.div>
          <motion.div 
            className="bg-casino-darker p-6 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <h3 className="text-xl font-bold mb-4 text-casino-gold">Easy to Learn</h3>
            <p>Simple rules but challenging gameplay for all skill levels</p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default HomePage; 