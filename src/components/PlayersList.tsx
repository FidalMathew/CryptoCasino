import { Trophy, TrendingUp } from "lucide-react";
import { PlayerBet } from "../types/game";

interface PlayersListProps {
  players: PlayerBet[];
  actualPrice: number | null;
  showResults: boolean;
}

export const PlayersList = ({
  players,
  actualPrice,
  showResults,
}: PlayersListProps) => {
  if (players.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border-2 border-gray-700 text-center">
        <p className="text-gray-400">No players yet. Be the first to join!</p>
      </div>
    );
  }

  const sortedPlayers =
    showResults && actualPrice
      ? [...players].sort((a, b) => {
          const diffA = Math.abs(a.predicted_price - actualPrice);
          const diffB = Math.abs(b.predicted_price - actualPrice);
          return diffA - diffB;
        })
      : players;

  return (
    <div className="bg-gray-800 rounded-xl border-2 border-gray-700 overflow-hidden">
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          Players & Predictions
        </h3>
      </div>

      <div className="divide-y divide-gray-700 max-h-64 overflow-y-auto">
        {sortedPlayers.map((player, index) => {
          const isWinner = showResults && index === 0;
          const difference = actualPrice
            ? Math.abs(player.predicted_price - actualPrice)
            : 0;

          return (
            <div
              key={player.id}
              className={`px-4 py-3 ${isWinner ? "bg-yellow-900/20" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isWinner && (
                    <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium truncate ${isWinner ? "text-yellow-400" : "text-white"}`}
                  >
                    {player.player_name}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Prediction</p>
                    <p className="text-sm font-semibold text-white">
                      ${player.predicted_price.toFixed(6)}
                    </p>
                  </div>

                  {showResults && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Diff</p>
                      <p className="text-sm font-semibold text-red-400">
                        {difference.toFixed(6)}
                      </p>
                    </div>
                  )}

                  <div className="text-right">
                    <p className="text-xs text-gray-400">Bet</p>
                    <p className="text-sm font-semibold text-green-400">
                      {player.bet_amount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
