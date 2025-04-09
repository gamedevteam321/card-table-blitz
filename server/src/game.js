import { supabaseAdmin } from './config/supabase.js';

// In-memory game state
const games = new Map();

// Create a new game
export async function createGame(creatorId) {
  // Verify user exists and is authenticated
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', creatorId)
    .single();

  if (userError || !user) {
    throw new Error('Invalid user');
  }

  const gameId = Math.random().toString(36).substring(2, 8);
  const gameState = {
    id: gameId,
    creator_id: creatorId,
    players: [creatorId],
    deck: shuffleDeck(createDeck()),
    table: [],
    current_turn: creatorId,
    status: 'waiting',
    created_at: new Date().toISOString()
  };

  games.set(gameId, gameState);

  // Store in Supabase with RLS policies
  const { error } = await supabaseAdmin
    .from('games')
    .insert([gameState]);

  if (error) {
    console.error('Error creating game in Supabase:', error);
    games.delete(gameId);
    throw error;
  }

  return gameState;
}

// Join an existing game
export async function joinGame(gameId, playerId) {
  // Verify user exists and is authenticated
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', playerId)
    .single();

  if (userError || !user) {
    throw new Error('Invalid user');
  }

  const game = games.get(gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  if (game.players.includes(playerId)) {
    throw new Error('Player already in game');
  }

  if (game.status !== 'waiting') {
    throw new Error('Game already started');
  }

  game.players.push(playerId);

  // Update in Supabase with RLS policies
  const { error } = await supabaseAdmin
    .from('games')
    .update({ players: game.players })
    .eq('id', gameId);

  if (error) {
    console.error('Error updating game in Supabase:', error);
    game.players.pop();
    throw error;
  }

  return game;
}

// Start the game
export async function startGame(gameId, userId) {
  const game = games.get(gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  if (game.creator_id !== userId) {
    throw new Error('Only the game creator can start the game');
  }

  if (game.status !== 'waiting') {
    throw new Error('Game already started');
  }

  if (game.players.length < 2) {
    throw new Error('Not enough players to start the game');
  }

  // Deal cards to players
  const cardsPerPlayer = Math.floor(game.deck.length / game.players.length);
  const playerHands = {};
  
  game.players.forEach(playerId => {
    playerHands[`player_${playerId}_hand`] = game.deck.splice(0, cardsPerPlayer);
  });

  game.status = 'playing';

  // Update in Supabase with RLS policies
  const { error } = await supabaseAdmin
    .from('games')
    .update({ 
      status: game.status,
      deck: game.deck,
      ...playerHands
    })
    .eq('id', gameId);

  if (error) {
    console.error('Error updating game in Supabase:', error);
    throw error;
  }

  // Update in-memory state
  Object.assign(game, playerHands);

  return game;
}

// Helper functions
function createDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }

  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Get game state
export function getGame(gameId) {
  return games.get(gameId);
}

// Update game state
export async function updateGame(gameId, updates, userId) {
  const game = games.get(gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  // Verify user is part of the game
  if (!game.players.includes(userId)) {
    throw new Error('User not part of this game');
  }

  // Verify it's the user's turn if updating game state
  if (updates.current_turn && updates.current_turn !== userId) {
    throw new Error('Not your turn');
  }

  Object.assign(game, updates);

  // Update in Supabase with RLS policies
  const { error } = await supabaseAdmin
    .from('games')
    .update(updates)
    .eq('id', gameId);

  if (error) {
    console.error('Error updating game in Supabase:', error);
    throw error;
  }

  return game;
} 