import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { generatePlayerColors } from "@/models/game";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SetupScreenProps {
  onStartGame: (playerNames: string[], playerCount: number) => void;
}

const SetupScreen = ({
  onStartGame
}: SetupScreenProps) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>([
    "Player 1", "Player 2", "Player 3", "Player 4"
  ]);
  const [error, setError] = useState<string>("");

  const handlePlayerCountChange = (value: string) => {
    setPlayerCount(parseInt(value));
    setError("");
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate names
    const activePlayerNames = playerNames.slice(0, playerCount);
    const emptyNames = activePlayerNames.filter(name => name.trim() === "");
    const duplicateNames = activePlayerNames.filter((name, index) => 
      activePlayerNames.indexOf(name) !== index && name.trim() !== ""
    );

    if (emptyNames.length > 0) {
      setError("Please enter names for all players");
      return;
    }

    if (duplicateNames.length > 0) {
      setError("Player names must be unique");
      return;
    }

    onStartGame(activePlayerNames, playerCount);
  };

  return (
    <div
      className="max-w-2xl w-full mx-auto p-6 sm:p-8 bg-casino rounded-lg border border-casino-table shadow-lg"
    >
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-white">Patte pe Patta</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="text-white text-lg sm:text-xl font-medium">
              Number of Players:
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPlayerCount(Math.max(2, playerCount - 1))}
                className={cn(
                  "w-10 h-10 rounded-[3px] bg-[#00a92d] hover:bg-[#00a92d]/70 text-white text-xl font-bold flex items-center justify-center transition-colors",
                  playerCount === 2 && "text-xs"
                )}
                disabled={playerCount === 2}
              >
                {playerCount === 2 ? "MIN" : "-"}
              </button>
              <span className="text-white text-xl font-bold min-w-[2rem] text-center">
                {playerCount}
              </span>
              <button
                type="button"
                onClick={() => setPlayerCount(Math.min(4, playerCount + 1))}
                className={cn(
                  "w-10 h-10 rounded-[3px] bg-[#00a92d] hover:bg-[#00a92d]/70 text-white text-xl font-bold flex items-center justify-center transition-colors",
                  playerCount === 4 && "text-xs"
                )}
                disabled={playerCount === 4}
              >
                {playerCount === 4 ? "MAX" : "+"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {Array.from({ length: playerCount }).map((_, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-center gap-4">
                <label className="text-white text-lg sm:text-xl font-medium min-w-[8rem]">
                  Player {index + 1}:
                </label>
                <input
                  type="text"
                  value={playerNames[index] || ''}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  placeholder={`Enter Player ${index + 1} name`}
                  className="flex-1 w-full sm:w-auto px-4 py-2 rounded-lg bg-casino-dark/50 border border-[#00a92d]/30 text-white placeholder-white/50 focus:outline-none focus:border-[#00a92d] focus:ring-1 focus:ring-[#00a92d]"
                  required
                />
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="w-full px-8 py-3 bg-[#00a92d] hover:bg-[#00a92d]/90 text-white font-bold rounded-[10px] text-lg transition-colors"
            >
              Start Game
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SetupScreen;
