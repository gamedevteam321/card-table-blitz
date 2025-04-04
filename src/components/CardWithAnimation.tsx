
import { useEffect, useState } from 'react';
import { Card as CardType } from '@/models/game';
import CardComponent from './Card';
import { cn } from '@/lib/utils';

interface CardWithAnimationProps {
  card: CardType;
  faceDown?: boolean;
  isTable?: boolean;
  isDealing?: boolean;
  animationType?: 'none' | 'hit' | 'capture' | 'throw';
  style?: React.CSSProperties;
  className?: string;
  onAnimationEnd?: () => void;
}

const CardWithAnimation = ({
  card,
  faceDown = false,
  isTable = false,
  isDealing = false,
  animationType = 'none',
  style,
  className,
  onAnimationEnd
}: CardWithAnimationProps) => {
  const [animationClass, setAnimationClass] = useState('');
  
  useEffect(() => {
    if (isDealing) {
      setAnimationClass('animate-card-deal');
      return;
    }
    
    if (animationType === 'hit') {
      setAnimationClass('animate-card-hit');
    } else if (animationType === 'capture') {
      setAnimationClass('animate-card-capture');
    } else if (animationType === 'throw') {
      setAnimationClass('animate-card-throw');
    } else {
      setAnimationClass('');
    }
    
    if (animationType !== 'none' && onAnimationEnd) {
      const timer = setTimeout(() => {
        onAnimationEnd();
      }, 700); // Match the animation duration
      
      return () => clearTimeout(timer);
    }
  }, [isDealing, animationType, onAnimationEnd]);

  return (
    <div className={cn(animationClass, 'relative')}>
      <CardComponent
        card={card}
        faceDown={faceDown}
        isTable={isTable}
        style={style}
        className={className}
      />
    </div>
  );
};

export default CardWithAnimation;
