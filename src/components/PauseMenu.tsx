
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Pause, Play, Home } from "lucide-react";

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

const PauseMenu = ({ onResume, onQuit, isPaused, onTogglePause }: PauseMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleResume = () => {
    setIsOpen(false);
    onResume();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="bg-casino-dark/70 border-casino-table hover:bg-casino-accent/20"
          onClick={() => {
            if (!isOpen) {
              onTogglePause();
            }
          }}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-casino-dark border-casino-table">
        <SheetHeader>
          <SheetTitle className="text-casino-gold">Game Paused</SheetTitle>
          <SheetDescription>
            The game is currently paused. What would you like to do?
          </SheetDescription>
        </SheetHeader>
        <div className="mt-8 flex flex-col space-y-4">
          <Button 
            className="bg-casino-accent hover:bg-casino-accent/90 text-white"
            onClick={handleResume}
          >
            <Play className="mr-2 h-4 w-4" />
            Resume Game
          </Button>
          <Button 
            variant="destructive"
            onClick={onQuit}
          >
            <Home className="mr-2 h-4 w-4" />
            Quit Game
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PauseMenu;
