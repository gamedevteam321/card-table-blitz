
import { cn } from "@/lib/utils";

interface DealerProps {
  isDealing: boolean;
  orientation: 'horizontal' | 'vertical';
}

const Dealer = ({ isDealing, orientation }: DealerProps) => {
  return (
    <div className={cn(
      "flex items-center gap-3",
      orientation === 'vertical' ? "flex-col" : "flex-row"
    )}>
      <div className="relative w-16 h-20">
        <img 
          src="https://cdn-icons-png.flaticon.com/512/4320/4320372.png" 
          alt="Dealer" 
          className={cn(
            "w-full h-full object-contain transition-transform",
            isDealing && "animate-bounce"
          )}
        />
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
