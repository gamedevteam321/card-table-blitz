import { motion } from 'framer-motion';
import CardBack from '../CardBack';

interface ShufflingStateProps {
  shuffleProgress: number;
  showShuffleAnimation: boolean;
}

const ShufflingState = ({ shuffleProgress, showShuffleAnimation }: ShufflingStateProps) => {
  return (
    <div className="relative w-full h-screen bg-casino-dark flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl text-casino-gold mb-4">Shuffling Cards...</h2>
        <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${shuffleProgress}%` }}
          />
        </div>
        {showShuffleAnimation && (
          <div className="mt-8">
            <div className="relative w-64 h-96 mx-auto">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-24 h-36 rounded-lg shadow-lg overflow-hidden"
                  style={{
                    left: '50%',
                    top: '50%',
                    marginLeft: '-48px',
                    marginTop: '-72px',
                  }}
                  initial={{ x: 0, y: 0, rotate: 0 }}
                  animate={{
                    x: [0, 50 - i * 5, -50 + i * 5, 0],
                    y: [0, -20 + i * 2, 20 - i * 2, 0],
                    rotate: [0, 45 - i * 5, -45 + i * 5, 0],
                    scale: [1, 1.1, 1.1, 1]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.1
                  }}
                >
                  <CardBack />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShufflingState; 