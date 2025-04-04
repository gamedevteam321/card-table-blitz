import React from 'react';
import { cn } from '@/lib/utils';

interface CardBackProps {
  className?: string;
}

const CardBack = ({ className }: CardBackProps) => {
  return (
    <div className={cn("w-full h-full relative rounded-lg overflow-hidden", className)}>
      <img
        src="/cardback.png"
        alt="Card Back"
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
};

export default CardBack; 