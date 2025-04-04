
import React from "react";
import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  name: string;
  avatarBg: string;
  ringColor: string;
  isCurrentPlayer: boolean;
  isCompact: boolean;
}

const PlayerAvatar = ({
  name,
  avatarBg,
  ringColor,
  isCurrentPlayer,
  isCompact
}: PlayerAvatarProps) => {
  const initials = name[0].toUpperCase();
  
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "rounded-full flex items-center justify-center font-bold text-white",
        avatarBg,
        "ring-2",
        ringColor,
        "shadow-inner",
        isCompact ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
      )}>
        {initials}
      </div>
      
      <div className="flex flex-col items-center">
        <span className={cn(
          "font-medium truncate mt-1",
          isCurrentPlayer 
            ? (isCompact ? "text-xs text-white" : "text-sm text-white") 
            : (isCompact ? "text-[10px] text-gray-300 max-w-[40px]" : "text-xs text-gray-300 max-w-[60px]")
        )}>
          {name}
        </span>
      </div>
    </div>
  );
};

export default PlayerAvatar;
