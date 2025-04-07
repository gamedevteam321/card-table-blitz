import React from 'react';
import { cn } from '@/lib/utils';
import cardback from '@/assets/cardback.png';

interface CardBackProps {
  className?: string;
}

const CardBack = ({ className }: CardBackProps) => {
  return (
    <div className={cn("w-full h-full relative rounded-lg overflow-hidden", className)}>
      <img
        src={cardback}
        alt="Card Back"
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
};

export default CardBack; 