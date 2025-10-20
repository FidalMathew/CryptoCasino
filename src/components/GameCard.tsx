import useGlobalContext from "@/context/useGlobalContext";
import { Users, Trophy, Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { formatEther, zeroAddress } from "viem";

interface GameCardProps {
  gameId: string;
}

interface GameData {
  id: string;
  symbol: string;
  startAt: bigint;
  joinEndsAt: bigint;
  endsAt: bigint;
  active: boolean;
  resolved: boolean;
  fixedBetAmount: bigint;
  totalPool: bigint;
  winner: string;
  finalPrice: bigint;
  bets: Array<{
    player: string;
    guessPrice: bigint;
    joined: boolean;
    claimed: boolean;
  }>;
}

export function GameCard({ gameId }: GameCardProps) {
  const [game, setGame] = useState<GameData | null>(null);
  const { getGameFromId } = useGlobalContext();

  useEffect(() => {
    if (!getGameFromId) return;
    const fetchGame = async () => {
      const gameData = await getGameFromId(gameId);
      if (gameData) {
        setGame(gameData as GameData);
      }
    };

    fetchGame();
  }, [gameId, getGameFromId]);

  const getStatusColor = () => {
    if (!game) return "bg-gray-500";
    if (game.resolved) return "bg-green-500";
    if (game.active) return "bg-blue-500";
    return "bg-yellow-500";
  };

  const playerCount = game?.bets?.length || 0;
  const maxPlayers = 10; // You can adjust this or get it from contract
  const hasJoined = false; // You can check if current user has joined
  const isFull = playerCount >= maxPlayers;
  const canJoin = game?.active && !game?.resolved && !hasJoined && !isFull;

  if (!game) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 sm:p-6 shadow-xl border border-gray-700">
        <p className="text-gray-400 text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 sm:p-6 shadow-xl border border-gray-700 hover:border-yellow-600 transition-all">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-2 sm:p-3 shadow-lg">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Game #{gameId}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400">{game.symbol}</p>
          </div>
        </div>
        <div
          className={`${getStatusColor()} px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap`}
        >
          {game.resolved ? "Completed" : game.active ? "Active" : "Waiting"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="bg-gray-950/50 rounded-lg p-2 sm:p-3 border border-gray-700">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Players</span>
          </div>
          <p className="text-base sm:text-lg font-bold text-white">
            {playerCount}
          </p>
        </div>

        <div className="bg-gray-950/50 rounded-lg p-2 sm:p-3 border border-gray-700">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
            <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">Bet</span>
          </div>
          <p className="text-base sm:text-lg font-bold text-white">
            {formatEther(game.fixedBetAmount).toString()} Tokens
          </p>
        </div>
      </div>

      {game.resolved && game.finalPrice > 0n && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-400">
              Final Price:
            </span>
            <span className="text-sm sm:text-lg font-bold text-green-400">
              {(Number(game.finalPrice) / 1e8).toString()}
            </span>
          </div>
          {game.winner && game.winner !== zeroAddress && (
            <div className="mt-2 pt-2 border-t border-green-500/20">
              <div className="flex items-center space-x-2">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                <span className="text-xs sm:text-sm text-gray-300">
                  Winner:{" "}
                  <span className="font-bold text-yellow-400">
                    {game.winner.slice(0, 6)}...{game.winner.slice(-4)}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {canJoin && (
        <button
          onClick={() => {
            // TODO: Implement join game logic
            console.log("Join game", gameId);
          }}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-bold py-2.5 sm:py-3 rounded-lg transition-all transform active:scale-95 sm:hover:scale-105 shadow-lg text-sm sm:text-base"
        >
          Join Game
        </button>
      )}

      {hasJoined && game.active && !game.resolved && (
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-2 sm:p-3 text-center">
          <p className="text-xs sm:text-sm text-blue-400 font-semibold">
            You're in! Waiting for game to end...
          </p>
        </div>
      )}

      {!game.active && isFull && !hasJoined && (
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-2 sm:p-3 text-center">
          <p className="text-xs sm:text-sm text-gray-400 font-semibold">
            Game Full
          </p>
        </div>
      )}
    </div>
  );
}
