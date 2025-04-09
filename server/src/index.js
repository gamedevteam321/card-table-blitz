import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createGame, joinGame, startGame, getGame, updateGame } from './game.js';
import { supabaseAdmin } from './config/supabase.js';
import {
  getUserProfile,
  updateUserProfile,
  getActiveGames,
  getWaitingGames,
  getGameHistory,
  getUserStats,
  updateUserStats
} from './db.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware for HTTP routes
const authenticateRequest = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Apply authentication middleware to API routes
app.use('/api', authenticateRequest);

// API Routes
// User profile
app.get('/api/profile', async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const profile = await updateUserProfile(req.user.id, req.body);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Game listings
app.get('/api/games/active', async (req, res) => {
  try {
    const games = await getActiveGames(req.user.id);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/games/waiting', async (req, res) => {
  try {
    const games = await getWaitingGames();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/games/history', async (req, res) => {
  try {
    const games = await getGameHistory(req.user.id);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Game statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getUserStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/stats', async (req, res) => {
  try {
    const stats = await updateUserStats(req.user.id, req.body);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return next(new Error('Authentication error: Invalid token'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: ' + error.message));
  }
};

// Apply authentication middleware
io.use(authenticateSocket);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Card Table Blitz Server is running' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.user.id);

  // Create a new game
  socket.on('CREATE_GAME', async () => {
    try {
      const game = await createGame(socket.user.id);
      socket.join(game.id);
      socket.emit('GAME_CREATED', { gameId: game.id, game });
    } catch (error) {
      socket.emit('ERROR', { message: error.message });
    }
  });

  // Join an existing game
  socket.on('JOIN_GAME', async ({ gameId }) => {
    try {
      const game = await joinGame(gameId, socket.user.id);
      socket.join(gameId);
      io.to(gameId).emit('PLAYER_JOINED', { userId: socket.user.id, game });
    } catch (error) {
      socket.emit('ERROR', { message: error.message });
    }
  });

  // Start the game
  socket.on('START_GAME', async ({ gameId }) => {
    try {
      const game = await startGame(gameId, socket.user.id);
      io.to(gameId).emit('GAME_STARTED', { game });
    } catch (error) {
      socket.emit('ERROR', { message: error.message });
    }
  });

  // Play a card
  socket.on('PLAY_CARD', async ({ gameId, card }) => {
    try {
      const game = getGame(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      const playerHand = game[`player_${socket.user.id}_hand`];
      const cardIndex = playerHand.findIndex(
        c => c.suit === card.suit && c.value === card.value
      );

      if (cardIndex === -1) {
        throw new Error('Card not in hand');
      }

      // Remove card from player's hand
      playerHand.splice(cardIndex, 1);
      
      // Add card to table
      game.table.push(card);

      // Update current turn to next player
      const currentPlayerIndex = game.players.indexOf(socket.user.id);
      const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
      game.current_turn = game.players[nextPlayerIndex];

      await updateGame(gameId, {
        [`player_${socket.user.id}_hand`]: playerHand,
        table: game.table,
        current_turn: game.current_turn
      }, socket.user.id);

      io.to(gameId).emit('CARD_PLAYED', { userId: socket.user.id, card, game });
    } catch (error) {
      socket.emit('ERROR', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 