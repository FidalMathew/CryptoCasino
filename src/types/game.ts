export interface BettingGame {
  id: string;
  memecoin_symbol: string;
  start_time: string;
  end_time: string | null;
  actual_price: number | null;
  min_players: number;
  current_players: number;
  status: "waiting" | "active" | "completed";
  created_at: string;
}

export interface PlayerBet {
  id: string;
  game_id: string;
  player_id: string;
  player_name: string;
  predicted_price: number;
  bet_amount: number;
  delegation_signature: string | null;
  is_winner: boolean;
  payout_amount: number;
  created_at: string;
}

export type Game = {
  id: string;
  symbol: string;
  startAt: bigint;
  joinEndsAt: bigint;
  endsAt: bigint;
  active: boolean;
  resolved: boolean;
  fixedBetAmount: bigint;
  totalPool: bigint;
  winner: string; // address
  finalPrice: bigint;
  bets: Array<{
    player: string;
    guessPrice: bigint;
    joined: boolean;
    claimed: boolean;
  }>;
};
