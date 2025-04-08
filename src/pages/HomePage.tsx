import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HomePage = () => {
  const navigate = useNavigate();
  const [showPlayOptions, setShowPlayOptions] = useState(false);

  const handlePlayClick = () => {
    setShowPlayOptions(true);
  };

  const handleLocalPlay = () => {
    navigate('/setup');
  };

  return (
    <div className="min-h-screen bg-casino-dark flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl sm:text-6xl font-bold text-casino-gold mb-8">
          Patte pe Patta
        </h1>
        
        {!showPlayOptions ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayClick}
            className="w-full px-8 py-3 bg-[#00a92d] hover:bg-[#00a92d]/90 text-white font-bold rounded-[10px] text-lg transition-colors"
          >
            Play Game
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 w-full"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLocalPlay}
              className="w-full px-8 py-3 bg-[#00a92d] hover:bg-[#00a92d]/90 text-white font-bold rounded-[10px] text-lg transition-colors"
            >
              Local Play
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled
              className="w-full px-8 py-3 bg-[#00a92d]/50 text-white/50 font-bold rounded-[10px] text-lg transition-colors cursor-not-allowed"
            >
              Online Play (Coming Soon)
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default HomePage; 