
// Define types for card suits and ranks
export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

// Card interface definition
export interface Card {
  suit: CardSuit;           // The suit of the card (hearts, diamonds, clubs, spades)
  rank: CardRank;           // The rank of the card (A, 2-10, J, Q, K)
  id: string;               // Unique identifier for animation purposes
  animationState?: 'throwing' | 'capturing' | 'placed' | 'none'; // Current animation state of the card
}

// Player status type
export type PlayerStatus = 'active' | 'inactive' | 'kicked' | 'winner' | 'loser';

// Player interface definition
export interface Player {
  id: string;               // Unique identifier for the player
  name: string;             // Display name of the player
  cards: Card[];            // Cards that the player has in hand
  status: PlayerStatus;     // Current status of the player
  shufflesRemaining: number; // Number of shuffles the player can still use
  autoPlayCount: number;    // Number of times the player has been auto-played
  avatarColor: string;      // Color for the player's avatar
}

// Game state interface definition
export interface GameState {
  players: Player[];                 // Array of players in the game
  currentPlayerIndex: number;        // Index of the current player in the players array
  tableCards: Card[];                // Cards currently on the table
  status: 'setup' | 'playing' | 'finished'; // Current game status
  winner: Player | null;             // The winner of the game, if any
  message: string;                   // Current game message to display
  turnStartTime: number;             // Timestamp when the current turn started
  gameStartTime: number;             // Timestamp when the game started
  animatingCard: Card | null;        // Card currently being animated
  isAnimating: boolean;              // Whether animation is in progress
}

// Utility function to create a standard deck of 52 cards
export const createDeck = (): Card[] => {
  const suits: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const deck: Card[] = [];
  
  // Generate all possible combinations of suits and ranks
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({
        suit,
        rank,
        id: `${rank}-${suit}-${Math.random().toString(36).substring(2, 9)}`, // Generate unique ID for each card
        animationState: 'none'
      });
    });
  });
  
  return deck;
};

// Shuffle a deck of cards using Fisher-Yates algorithm
export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]; // Swap elements
  }
  return newDeck;
};

// Get the numeric value of a card based on its rank
export const getCardValue = (card: Card): number => {
  const rankValues: Record<CardRank, number> = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };
  return rankValues[card.rank];
};

// Check if a card matches the top card on the table
export const checkCardMatch = (card: Card, tableCards: Card[]): boolean => {
  if (tableCards.length === 0) return false;
  
  const topCard = tableCards[tableCards.length - 1];
  return getCardValue(card) === getCardValue(topCard);
};

// Generate an array of background colors for player avatars
export const generatePlayerColors = (count: number): string[] => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-red-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
  ];
  
  // Shuffle colors and take the first 'count' colors
  return shuffleDeck(colors.map(color => ({ suit: 'hearts' as CardSuit, rank: 'A' as CardRank, id: color })))
    .slice(0, count)
    .map(card => card.id);
};
