import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { generatePlayerColors } from "@/models/game";
interface SetupScreenProps {
  onStartGame: (playerNames: string[], playerCount: number) => void;
}
const SetupScreen = ({
  onStartGame
}: SetupScreenProps) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(Array(4).fill("").map((_, i) => `Player ${i + 1}`));
  const handlePlayerCountChange = (value: string) => {
    setPlayerCount(parseInt(value));
  };
  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate names
    const activePlayerNames = playerNames.slice(0, playerCount);
    if (activePlayerNames.some(name => name.trim() === "")) {
      alert("Please enter names for all players");
      return;
    }
    onStartGame(activePlayerNames, playerCount);
  };
  return <div className="max-w-md w-full mx-auto p-6 bg-casino rounded-lg border border-casino-table shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-casino-gold">Satte pe Satta</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Number of Players</label>
          <Select onValueChange={handlePlayerCountChange} defaultValue={playerCount.toString()}>
            <SelectTrigger className="bg-casino-dark border-casino-table">
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
          <h3 className="text-sm font-medium mb-2 text-zinc-50">Player Names</h3>
          
          {Array.from({
          length: playerCount
        }).map((_, i) => <div key={i}>
              <label className="block text-xs text-gray-400 mb-1">Player {i + 1}</label>
              <Input value={playerNames[i]} onChange={e => handleNameChange(i, e.target.value)} className="bg-casino-dark border-casino-table" maxLength={10} />
            </div>)}
        </div>
        
        <Button type="submit" className="w-full bg-casino-accent hover:bg-casino-accent/90 text-white">
          Start Game
        </Button>
      </form>
    </div>;
};
export default SetupScreen;