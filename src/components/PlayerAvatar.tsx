
import React from "react";
import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  name: string;               // Player's name
  avatarBg: string;           // Background color for the avatar
  ringColor: string;          // Ring color around the avatar
  isCurrentPlayer: boolean;   // Whether this is the active player
  isCompact: boolean;         // Whether to use compact layout
}

const PlayerAvatar = ({
  name,
  avatarBg,
  ringColor,
  isCurrentPlayer,
  isCompact
}: PlayerAvatarProps) => {
  // Get first letter of player's name for the avatar
  const initials = name[0].toUpperCase();
  
  return (
    <div className="flex flex-col items-center">
      {/* Avatar circle with player's initial */}
      <div className={cn(
        "rounded-full flex items-center justify-center font-bold text-white",
        isCurrentPlayer ? "player-avatar-active" : "player-avatar-inactive",
        isCompact ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
      )}>
        {initials}
      </div>
      
      {/* Player name displayed below avatar */}
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
