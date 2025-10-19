import { useState } from "react";
import { Dice5, TrendingUp } from "lucide-react";
import { GameCard } from "./components/GameCard";
import { BetModal } from "./components/BetModal";

import { generateMockGames } from "./utils/utils";
import useGlobalContext from "./context/useGlobalContext";
import { useNavigate } from "react-router-dom";

function Home() {
  const [games, setGames] = useState<any[]>(generateMockGames());
  const [showBetModal, setShowBetModal] = useState(false);
  const [gameToJoin, setGameToJoin] = useState<string | null>(null);
  const { game } = useGlobalContext();
  const navigate = useNavigate();

  const currentUserId = "current-user";

  const handleSubmitBet = (playerName: string, predictedPrice: number) => {
    if (!gameToJoin) return;

    setGames((prevGames) =>
      prevGames.map((game) => {
        if (game.id === gameToJoin) {
          const newBet = {
            id: `bet-${Date.now()}`,
            game_id: game.id,
            user_id: currentUserId,
            player_name: playerName,
            predicted_price: predictedPrice,
            is_winner: false,
            created_at: new Date().toISOString(),
          };

          const updatedBets = [...game.bets, newBet];
          const shouldStart =
            updatedBets.length >= game.min_players && game.status === "waiting";

          return {
            ...game,
            bets: updatedBets,
            status: shouldStart ? "active" : game.status,
          };
        }
        return game;
      })
    );

    setShowBetModal(false);
    setGameToJoin(null);
  };

  // const handleViewGame = (game: any) => {
  //   setSelectedGame(game);
  //   setActiveView("game");
  // };

  // const handleBackToList = () => {
  //   setActiveView("list");
  //   setSelectedGame(null);
  //   setGames(generateMockGames());
  // };

  // const activeGames = games.filter((g) => g.status === "active");
  // const waitingGames = games.filter((g) => g.status === "waiting");
  // const completedGames = games.filter((g) => g.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg sm:rounded-xl p-1.5 sm:p-2 shadow-lg">
                <Dice5 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">
                  Memecoin Casino
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  Predict & Win
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-gray-800 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-700">
                <p className="text-xs text-gray-400">Balance</p>
                <p className="text-sm sm:text-lg font-bold text-yellow-400">
                  1,000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-400 mb-1">
                  Active Games
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {game?.length}
                </p>
              </div>
              <div className="bg-blue-500/20 rounded-full p-2 sm:p-3">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            <span>Active Games</span>
          </h2>
          {game &&
            game.length > 0 &&
            game.map((_, index: number) => (
              <div
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-6 pt-2"
                key={index}
              >
                <div
                  key={index}
                  onClick={() => navigate(`/game/${index}`)}
                  className="cursor-pointer"
                >
                  <GameCard gameId={index.toString()} />
                </div>
              </div>
            ))}
        </div>

        {/* {waitingGames.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              <span>Waiting for Players</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {waitingGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onJoinGame={handleJoinGame}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </div>
        )} */}

        {/* {completedGames.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 flex items-center space-x-2">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              <span>Completed Games</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {completedGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onJoinGame={handleJoinGame}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </div>
        )} */}
      </div>

      <BetModal
        isOpen={showBetModal}
        onClose={() => {
          setShowBetModal(false);
          setGameToJoin(null);
        }}
        onSubmit={handleSubmitBet}
        memecoinSymbol={
          games.find((g) => g.id === gameToJoin)?.memecoin_symbol || "DOGE"
        }
        betAmount={games.find((g) => g.id === gameToJoin)?.bet_amount || 10}
      />
    </div>
  );
}

export default Home;
