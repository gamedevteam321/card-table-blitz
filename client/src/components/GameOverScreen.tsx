
import { Button } from "@/components/ui/button";
import { Player } from "@/models/game";

interface GameOverScreenProps {
  winner: Player;
  players?: Player[]; // Made optional
  onPlayAgain: () => void;
}

const GameOverScreen = ({ winner, players = [], onPlayAgain }: GameOverScreenProps) => {
  // Sort players by their card count (descending) if players are provided
  const sortedPlayers = players.length > 0 
    ? [...players].sort((a, b) => b.cards.length - a.cards.length)
    : [winner]; // Fallback to just showing the winner

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-casino rounded-lg border border-casino-table shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-casino-gold">Game Over!</h2>
      
      <div className="mb-6 text-center">
        <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold text-white ${winner.avatarColor}`}>
          {winner.name[0].toUpperCase()}
        </div>
        <h3 className="text-xl font-bold">{winner.name} wins!</h3>
        <p className="text-sm text-gray-400">with {winner.cards.length} cards</p>
      </div>
      
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Final Standings</h4>
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.id} 
              className={`flex items-center justify-between p-2 rounded ${player.id === winner.id ? 'bg-casino-accent/20' : 'bg-casino-dark'}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800">
                  {index + 1}
                </div>
                <span>{player.name}</span>
              </div>
              <span>{player.cards.length} cards</span>
            </div>
          ))}
        </div>
      </div>
      
      <Button 
        onClick={onPlayAgain} 
        className="w-full bg-casino-accent hover:bg-casino-accent/90 text-white"
      >
        Play Again
      </Button>
    </div>
  );
};

export default GameOverScreen;
