import { Button } from '../ui/button';

interface WaitingStateProps {
  onStartGame: () => void;
}

const WaitingState = ({ onStartGame }: WaitingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-casino-dark p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-casino-gold mb-8">Card Table Blitz</h1>
        <Button
          onClick={onStartGame}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg"
        >
          Start Game
        </Button>
      </div>
    </div>
  );
};

export default WaitingState; 