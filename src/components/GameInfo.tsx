import { Users, Clock, Trophy, Coins } from "lucide-react";
import { BettingGame, PlayerBet } from "../types/game";
import { useEffect, useState } from "react";
import useGlobalContext from "@/context/useGlobalContext";

interface GameInfoProps {
  game: BettingGame | null;
  players: PlayerBet[];
  totalPrizePool: number;
}

export const GameInfo = ({ game, totalPrizePool }: GameInfoProps) => {
  if (!game) return null;

  const { resolveGame } = useGlobalContext();
  const [hasError, setHasError] = useState(false);

  const timeUntilStart = game.start_time
    ? Math.max(
        0,
        Math.floor((new Date(game.start_time).getTime() - Date.now()) / 1000)
      )
    : 0;
  useEffect(() => {
    if (!resolveGame || !game || hasError) return;
    if (timeUntilStart === 0 && game.status === "active") {
      try {
        resolveGame(game.id);
      } catch (error) {
        setHasError(true);
      }
    }
  }, [timeUntilStart, game?.id, game?.status, resolveGame, hasError]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
      <div className="bg-gray-800 rounded-xl p-3 sm:p-4 border-2 border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          <span className="text-xs sm:text-sm text-gray-400">Players</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-white">
          {game.current_players}
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl p-3 sm:p-4 border-2 border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
          <span className="text-xs sm:text-sm text-gray-400">Prize Pool</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-yellow-400">
          {totalPrizePool}
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl p-3 sm:p-4 border-2 border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          <span className="text-xs sm:text-sm text-gray-400">Coin</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-white">
          {game.memecoin_symbol}
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl p-3 sm:p-4 border-2 border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          <span className="text-xs sm:text-sm text-gray-400">Status</span>
        </div>
        <p className="text-base sm:text-lg font-bold text-white capitalize">
          {(() => {
            if (!game.end_time) return "No end time";
            const remainingMs = new Date(game.end_time).getTime() - Date.now();
            if (remainingMs <= 0) return "Game ended";
            const totalSeconds = Math.floor(remainingMs / 1000);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            return `${h}h ${m}m ${s}s`;
          })()}
        </p>
      </div>
    </div>
  );
};
