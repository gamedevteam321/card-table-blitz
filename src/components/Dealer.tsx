
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DealerProps {
  isDealing: boolean;
  orientation: 'horizontal' | 'vertical';
  onDealComplete?: () => void;
}

const Dealer = ({ isDealing, orientation, onDealComplete }: DealerProps) => {
  return (
    <div className={cn(
      "flex items-center gap-3",
      orientation === 'vertical' ? "flex-col" : "flex-row"
    )}>
      <div className="relative w-16 h-20">
        <motion.img 
          src="https://cdn-icons-png.flaticon.com/512/4320/4320372.png" 
          alt="Dealer" 
          className="w-full h-full object-contain"
          animate={isDealing ? {
            rotate: [0, -10, 10, -5, 0],
            y: [0, -5, 0]
          } : {}}
          transition={{
            duration: 0.5,
            repeat: isDealing ? 3 : 0,
            repeatType: "reverse",
            onComplete: onDealComplete
          }}
        />
        {isDealing && (
          <motion.div 
            className="absolute top-0 -right-2 w-10 h-14 bg-white border border-gray-300 rounded-md card-back"
            initial={{ x: 0, y: 0, rotate: 0 }}
            animate={{ x: "150%", y: "100%", rotate: 360, opacity: 0 }}
            transition={{ 
              duration: 0.8, 
              repeat: 5, 
              repeatType: "loop",
              repeatDelay: 0.2
            }}
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-casino-gold">Dealer</span>
        <span className="text-xs text-gray-400">
          {isDealing ? "Dealing cards..." : "Waiting for players..."}
        </span>
      </div>
    </div>
  );
};

export default Dealer;
