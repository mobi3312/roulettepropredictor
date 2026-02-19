
export type RouletteColor = 'red' | 'black' | 'green';

export interface RouletteNumber {
  value: number;
  color: RouletteColor;
}

export interface BetResult {
  timestamp: string;
  betAmount: number;
  outcome: 'win' | 'loss';
  profit: number;
}

export interface GameState {
  history: RouletteNumber[];
  bankroll: number;
  currentBet: number;
  lastBetOutcome: 'win' | 'loss' | 'none';
  martingaleEnabled: boolean;
  prediction: RouletteNumber | null;
  confidence: number;
  isLoading: boolean;
  betHistory: BetResult[];
  totalProfit: number;
}

export enum BettingStrategy {
  MARTINGALE = 'Martingale',
  FLAT = 'Flat',
}
