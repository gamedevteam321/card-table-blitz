import { Player, Card } from '../../models/game';
import PlayerArea from '../PlayerArea';
import GameTable from '../GameTable';
import StatusMessage from '../StatusMessage';
import Confetti from '../Confetti';
import PauseMenu from '../PauseMenu';
import { useIsMobile } from '../../hooks/use-mobile';

interface PlayingStateProps {
  players: Player[];
  currentPlayerIndex: number;
  tableCards: Card[];
  animatingCard: Card | null;
  isAnimating: boolean;
  timeRemaining: number;
  gameTimeRemaining: number;
  lastActionType: 'none' | 'hit' | 'capture' | 'throw';
  isDealing: boolean;
  showStatusMessage: boolean;
  statusMessage: { text: string; type: 'info' | 'success' | 'warning' | 'error' };
  showCaptureConfetti: boolean;
  capturePosition: { x: number; y: number } | null;
  isPaused: boolean;
  throwingPlayerPosition: 'top' | 'left' | 'right' | 'bottom' | null;
  playerPositions: Record<string, string>;
  capturingPlayerId: string | null;
  onHideStatusMessage: () => void;
  onTogglePause: () => void;
  onResumeGame: () => void;
  onQuitGame: () => void;
  onHit: (playerId: string) => void;
  onShuffle: (playerId: string) => void;
}

const PlayingState = ({
  players,
  currentPlayerIndex,
  tableCards,
  animatingCard,
  isAnimating,
  timeRemaining,
  gameTimeRemaining,
  lastActionType,
  isDealing,
  showStatusMessage,
  statusMessage,
  showCaptureConfetti,
  capturePosition,
  isPaused,
  throwingPlayerPosition,
  playerPositions,
  capturingPlayerId,
  onHideStatusMessage,
  onTogglePause,
  onResumeGame,
  onQuitGame,
  onHit,
  onShuffle
}: PlayingStateProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
      <StatusMessage 
        message={statusMessage.text}
        type={statusMessage.type}
        isVisible={showStatusMessage}
        onHide={onHideStatusMessage}
      />
      
      <div className="bg-casino p-2 rounded-lg shadow-lg border border-casino-table mb-4 flex justify-between items-center">
        <h1 className="text-base sm:text-xl font-bold text-casino-gold">Card Table Blitz</h1>
        <div className="text-xs sm:text-sm text-gray-400">
          Game time: {Math.floor(gameTimeRemaining / 60)}:{(gameTimeRemaining % 60).toString().padStart(2, '0')}
        </div>
        <div className="flex gap-2">
          <PauseMenu 
            isPaused={isPaused}
            onTogglePause={onTogglePause}
            onResume={onResumeGame}
            onQuit={onQuitGame}
          />
        </div>
      </div>
      
      {showCaptureConfetti && capturePosition && (
        <Confetti isActive={true} position={capturePosition} />
      )}
      
      <div className="relative flex-grow min-h-[calc(100vh-160px)] bg-casino-dark rounded-xl overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full sm:w-4/5 px-2 sm:px-0">
          <GameTable 
            cards={tableCards} 
            animatingCard={animatingCard}
            animatingPlayerPosition={throwingPlayerPosition}
          />
        </div>
        
        {players.map((player, index) => {
          const position = playerPositions[player.id];
          const isCurrentPlayer = index === currentPlayerIndex;
          const isCapturing = player.id === capturingPlayerId;
          
          let positionClass = '';
          
          if (isMobile) {
            if (position === 'top') {
              positionClass = 'top-2 left-1/2 transform -translate-x-1/2';
            } else if (position === 'right') {
              positionClass = 'right-1 top-1/2 transform -translate-y-1/2';
            } else if (position === 'bottom') {
              positionClass = 'bottom-2 left-1/2 transform -translate-x-1/2';
            } else if (position === 'left') {
              positionClass = 'left-1 top-1/2 transform -translate-y-1/2';
            }
          } else {
            if (position === 'top') {
              positionClass = 'top-8 left-1/2 transform -translate-x-1/2';
            } else if (position === 'right') {
              positionClass = 'right-8 top-1/2 transform -translate-y-1/2';
            } else if (position === 'bottom') {
              positionClass = 'bottom-8 left-1/2 transform -translate-x-1/2';
            } else if (position === 'left') {
              positionClass = 'left-8 top-1/2 transform -translate-y-1/2';
            }
          }
          
          const scaleClass = isMobile ? 
            (position === 'left' || position === 'right' ? 'scale-80' : 'scale-90') : '';
          
          return (
            <div 
              key={player.id} 
              id={`player-${player.id}`}
              className={`absolute ${positionClass} ${scaleClass}`}
              style={{ zIndex: isCurrentPlayer ? 20 : 10 }}
            >
              <PlayerArea
                player={player}
                isCurrentPlayer={isCurrentPlayer}
                onHit={() => onHit(player.id)}
                onShuffle={() => onShuffle(player.id)}
                timeRemaining={timeRemaining}
                orientation={position === 'left' || position === 'right' ? 'vertical' : 'horizontal'}
                lastActionType={isCurrentPlayer ? lastActionType : 'none'}
                isDealing={isDealing}
                positionClass={position}
                isCapturing={isCapturing}
                isMobile={isMobile}
                isAnimating={isAnimating}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayingState; 