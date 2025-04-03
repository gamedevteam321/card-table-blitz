
export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: CardSuit;
  rank: CardRank;
  id: string; // unique identifier for animation purposes
}

export type PlayerStatus = 'active' | 'inactive' | 'kicked' | 'winner' | 'loser';

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  status: PlayerStatus;
  shufflesRemaining: number;
  autoPlayCount: number;
  avatarColor: string;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  tableCards: Card[];
  status: 'setup' | 'playing' | 'finished';
  winner: Player | null;
  message: string;
  turnStartTime: number;
  gameStartTime: number;
}

// Utility functions
export const createDeck = (): Card[] => {
  const suits: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const deck: Card[] = [];
  
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({
        suit,
        rank,
        id: `${rank}-${suit}-${Math.random().toString(36).substring(2, 9)}`
      });
    });
  });
  
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const getCardValue = (card: Card): number => {
  const rankValues: Record<CardRank, number> = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };
  return rankValues[card.rank];
};

export const checkCardMatch = (card: Card, tableCards: Card[]): boolean => {
  if (tableCards.length === 0) return false;
  
  const topCard = tableCards[tableCards.length - 1];
  return getCardValue(card) === getCardValue(topCard);
};

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
