import { Server, Socket } from 'socket.io';
import { supabase } from '../config/supabase';
import { SocketUser } from '../types';

const connectedUsers: Map<string, SocketUser> = new Map();

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    socket.on('user:join', async (userId: string) => {
      connectedUsers.set(socket.id, { userId, socketId: socket.id });
      console.log('User joined:', userId);
    });

    socket.on('room:join', async (roomId: string) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;

      socket.join(roomId);
      user.roomId = roomId;

      // Notify room about new user
      io.to(roomId).emit('room:user_joined', {
        userId: user.userId,
        roomId,
      });

      // Get room participants
      const { data: participants } = await supabase
        .from('room_participants')
        .select('user_id')
        .eq('room_id', roomId);

      if (participants) {
        socket.emit('room:participants', participants);
      }
    });

    socket.on('room:message', async (data: { roomId: string; message: string }) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;

      const { data: message, error } = await supabase
        .from('room_messages')
        .insert([
          {
            room_id: data.roomId,
            user_id: user.userId,
            content: data.message,
          },
        ])
        .select()
        .single();

      if (!error && message) {
        io.to(data.roomId).emit('room:new_message', message);
      }
    });

    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        if (user.roomId) {
          io.to(user.roomId).emit('room:user_left', {
            userId: user.userId,
            roomId: user.roomId,
          });
        }
        connectedUsers.delete(socket.id);
      }
      console.log('User disconnected:', socket.id);
    });
  });
}; 