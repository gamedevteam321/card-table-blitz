export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          created_by: string
          current_turn: string | null
          status: 'waiting' | 'playing' | 'completed'
          created_at: string
          updated_at: string
          code: string
          amount_stack: number
          max_players: number
          waiting_time: number
        }
        Insert: {
          id?: string
          created_by: string
          current_turn?: string | null
          status?: 'waiting' | 'playing' | 'completed'
          created_at?: string
          updated_at?: string
          code: string
          amount_stack?: number
          max_players?: number
          waiting_time?: number
        }
        Update: {
          id?: string
          created_by?: string
          current_turn?: string | null
          status?: 'waiting' | 'playing' | 'completed'
          created_at?: string
          updated_at?: string
          code?: string
          amount_stack?: number
          max_players?: number
          waiting_time?: number
        }
      }
      moves: {
        Row: {
          id: string
          room_id: string
          player_id: string
          card_played: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          card_played: string
          position: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          card_played?: string
          position?: number
          created_at?: string
        }
      }
      games: {
        Row: {
          id: string
          room_id: string
          status: 'waiting' | 'playing' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          status?: 'waiting' | 'playing' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          status?: 'waiting' | 'playing' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      player_readiness: {
        Row: {
          id: string
          room_id: string
          player_id: string
          is_ready: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          is_ready?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          is_ready?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 