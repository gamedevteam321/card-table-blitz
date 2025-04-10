export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'public' | 'private';
  game_type: string;
  max_players: number;
  stake_value: number;
  created_by: string;
  created_at: string;
  status: 'waiting' | 'playing' | 'finished';
}

export interface RoomParticipant {
  room_id: string;
  user_id: string;
  joined_at: string;
  is_host: boolean;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface SocketUser {
  userId: string;
  socketId: string;
  roomId?: string;
} 