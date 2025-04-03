
import { useEffect, useState } from "react";

interface ConfettiProps {
  isActive: boolean;
  position?: { x: number, y: number } | null;
}

const Confetti = ({ isActive, position = null }: ConfettiProps) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    size: number;
    speed: number;
  }>>([]);

  useEffect(() => {
    if (isActive) {
      const newParticles = [];
      const colors = [
        'bg-red-500',
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-casino-gold'
      ];
      
      const particleCount = position ? 50 : 100;
      
      for (let i = 0; i < particleCount; i++) {
        const speed = 2 + Math.random() * 3;
        
        newParticles.push({
          id: i,
          // If position is provided, use it as the starting point
          x: position ? position.x + Math.random() * 40 - 20 : Math.random() * 100, 
          y: position ? position.y : -5, // start above the viewport or at position
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          size: 3 + Math.random() * 7,
          speed: speed
        });
      }
      
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isActive, position]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute ${particle.color} rounded-sm`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size * 2}px`,
            transform: `rotate(${particle.rotation}deg)`,
            animation: `confetti ${4 / particle.speed}s ease-out forwards`
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
