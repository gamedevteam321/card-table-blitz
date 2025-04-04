import { motion } from 'framer-motion';

interface ShufflingStateProps {
  shuffleProgress: number;
  showShuffleAnimation: boolean;
}

const ShufflingState = ({ shuffleProgress, showShuffleAnimation }: ShufflingStateProps) => {
  return (
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
                className="absolute w-16 h-24 bg-white rounded-md shadow-lg card-back"
                initial={{ x: 0, y: 0, rotate: 0 }}
                animate={{
                  x: [0, 50, -50, 0],
                  y: [0, -20, 20, 0],
                  rotate: [0, 45, -45, 0]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShufflingState; 