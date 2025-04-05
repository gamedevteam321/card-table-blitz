import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { generatePlayerColors } from "@/models/game";
import { motion } from "framer-motion";

interface SetupScreenProps {
  onStartGame: (playerNames: string[], playerCount: number) => void;
}

const SetupScreen = ({
  onStartGame
}: SetupScreenProps) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(Array(4).fill(""));
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto p-6 bg-casino rounded-lg border border-casino-table shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-casino-gold">Satte pe Satta</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-white">Number of Players</label>
          <Select onValueChange={handlePlayerCountChange} defaultValue={playerCount.toString()}>
            <SelectTrigger className="bg-casino-dark border-casino-table text-white">
              <SelectValue placeholder="Select player count" />
            </SelectTrigger>
            <SelectContent className="bg-casino-dark border-casino-table">
              <SelectItem value="2">2 Players</SelectItem>
              <SelectItem value="3">3 Players</SelectItem>
              <SelectItem value="4">4 Players</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium mb-2 text-white">Player Names</h3>
          
          {Array.from({ length: playerCount }).map((_, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <label className="block text-xs text-gray-300 mb-1">Player {i + 1}</label>
              <Input 
                value={playerNames[i]} 
                onChange={e => handleNameChange(i, e.target.value)} 
                className="bg-casino-dark border-casino-table text-white placeholder-gray-500"
                placeholder={`Enter Player ${i + 1} name`}
                maxLength={15}
              />
            </motion.div>
          ))}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mb-4 text-center"
          >
            {error}
          </motion.div>
        )}
        
        <Button 
          type="submit" 
          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white font-medium"
        >
          Start Game
        </Button>
      </form>
    </motion.div>
  );
};

export default SetupScreen;
