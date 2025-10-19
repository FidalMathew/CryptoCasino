import { GameWithBets } from "../types/game";

export function generateMockGames(): GameWithBets[] {
  const symbols = ["DOGE", "SHIB", "PEPE", "FLOKI"];
  const games: GameWithBets[] = [];

  for (let i = 0; i < 6; i++) {
    const status = i === 0 ? "active" : i < 3 ? "waiting" : "completed";
    const symbol = symbols[i % symbols.length];
    const actualPrice =
      status === "completed" || status === "active"
        ? Math.random() * 0.001
        : undefined;

    const bets = [];
    const betCount =
      status === "waiting"
        ? Math.floor(Math.random() * 5) + 1
        : status === "active"
          ? 8
          : 10;

    for (let j = 0; j < betCount; j++) {
      const predictedPrice = Math.random() * 0.001;
      const difference = actualPrice
        ? Math.abs(predictedPrice - actualPrice)
        : undefined;

      bets.push({
        id: `bet-${i}-${j}`,
        game_id: `game-${i}`,
        user_id: j === 0 ? "current-user" : `user-${j}`,
        player_name: j === 0 ? "You" : `Player${j}`,
        predicted_price: predictedPrice,
        difference,
        is_winner: false,
        created_at: new Date().toISOString(),
      });
    }

    if (actualPrice && bets.length > 0) {
      bets.sort((a, b) => {
        const diffA = Math.abs(a.predicted_price - actualPrice);
        const diffB = Math.abs(b.predicted_price - actualPrice);
        return diffA - diffB;
      });
      bets[0].is_winner = true;
    }

    games.push({
      id: `game-${i}`,
      game_number: 1000 + i,
      memecoin_symbol: symbol,
      status,
      min_players: 2,
      max_players: 10,
      bet_amount: 10,
      actual_price: actualPrice,
      winner_id: status === "completed" ? bets[0]?.user_id : undefined,
      starts_at: new Date(Date.now() - i * 3600000).toISOString(),
      ends_at: status === "completed" ? new Date().toISOString() : undefined,
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      bets,
    });
  }

  return games;
}
