import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Room, RoomParticipant } from '../types';

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, type, game_type, max_players, stake_value } = req.body;
    const userId = req.user.id;

    const { data: room, error } = await supabase
      .from('rooms')
      .insert([
        {
          name,
          type,
          game_type,
          max_players,
          stake_value,
          created_by: userId,
          status: 'waiting',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Add creator as participant
    await supabase.from('room_participants').insert([
      {
        room_id: room.id,
        user_id: userId,
        is_host: true,
      },
    ]);

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*, room_participants(count)')
      .eq('type', 'public')
      .eq('status', 'waiting');

    if (error) throw error;

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if room exists and has space
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*, room_participants(count)')
      .eq('id', roomId)
      .single();

    if (roomError) throw roomError;

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Room is not accepting players' });
    }

    if (room.room_participants[0].count >= room.max_players) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Add user to room
    const { error: joinError } = await supabase
      .from('room_participants')
      .insert([
        {
          room_id: roomId,
          user_id: userId,
          is_host: false,
        },
      ]);

    if (joinError) throw joinError;

    res.json({ message: 'Joined room successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join room' });
  }
}; 