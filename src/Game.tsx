import { useEffect, useState } from "react";
import { Dices, RefreshCw } from "lucide-react";
import { BettingGame, type Game, PlayerBet } from "./types/game";
import { SlotMachine } from "./components/SlotMachine";
import { BetForm } from "./components/BetForm";
import { GameInfo } from "./components/GameInfo";
import { PlayersList } from "./components/PlayersList";
import { ClaimWinner } from "./components/ClaimWinner";
import { Delegation } from "./utils/Delegation";
import useGlobalContext from "./context/useGlobalContext";
import { useParams } from "react-router-dom";

function Game() {
  const { id } = useParams();

  const [currentGame, setCurrentGame] = useState<BettingGame | null>(null); // remove
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<PlayerBet[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prizeClaimed, setPrizeClaimed] = useState(false);
  const { getGameFromId } = useGlobalContext();

  useEffect(() => {
    if (!getGameFromId) return;
    if (!id) return;
    (async function () {
      const game = await getGameFromId(id);
      if (game) setGame(game);
    })();
  }, [getGameFromId, id]);

  console.log(game, "game");

  const createNewGame = () => {
    const memecoins = ["DOGE", "SHIB", "PEPE", "FLOKI"];
    const randomCoin = memecoins[Math.floor(Math.random() * memecoins.length)];

    const newGame: BettingGame = {
      id: crypto.randomUUID(),
      memecoin_symbol: randomCoin,
      start_time: new Date().toISOString(),
      end_time: null,
      actual_price: null,
      min_players: 2,
      current_players: 0,
      status: "waiting",
      created_at: new Date().toISOString(),
    };

    setCurrentGame(newGame);
    setPlayers([]);
    setShowResults(false);
    setPrizeClaimed(false);
  };

  const handleSubmitBet = (
    betAmount: number,
    predictedPrice: number,
    signature: string
  ) => {
    if (!currentGame) return;

    const playerId = crypto.randomUUID();
    const playerName = `Player${Math.floor(Math.random() * 9000) + 1000}`;

    const newBet: PlayerBet = {
      id: crypto.randomUUID(),
      game_id: currentGame.id,
      player_id: playerId,
      player_name: playerName,
      predicted_price: predictedPrice,
      bet_amount: betAmount,
      delegation_signature: signature,
      is_winner: false,
      payout_amount: 0,
      created_at: new Date().toISOString(),
    };

    const updatedPlayers = [...players, newBet];
    setPlayers(updatedPlayers);

    const newPlayerCount = currentGame.current_players + 1;
    const newStatus =
      newPlayerCount >= currentGame.min_players ? "active" : "waiting";

    setCurrentGame({
      ...currentGame,
      current_players: newPlayerCount,
      status: newStatus,
    });

    if (newStatus === "active") {
      setTimeout(() => {
        startGame(updatedPlayers);
      }, 2000);
    }
  };

  const startGame = (gamePlayers: PlayerBet[]) => {
    if (!currentGame) return;

    setIsSpinning(true);

    const actualPrice = Math.random() * 0.5;

    setTimeout(() => {
      setCurrentGame({
        ...currentGame,
        status: "completed",
        actual_price: actualPrice,
        end_time: new Date().toISOString(),
      });

      const sortedPlayers = [...gamePlayers].sort((a, b) => {
        const diffA = Math.abs(a.predicted_price - actualPrice);
        const diffB = Math.abs(b.predicted_price - actualPrice);
        return diffA - diffB;
      });

      const totalPrize = gamePlayers.reduce(
        (sum, p) => sum + Number(p.bet_amount),
        0
      );

      const updatedPlayers = gamePlayers.map((player) => ({
        ...player,
        is_winner: player.id === sortedPlayers[0].id,
        payout_amount: player.id === sortedPlayers[0].id ? totalPrize : 0,
      }));

      setPlayers(updatedPlayers);
      setShowResults(true);
      setIsSpinning(false);
    }, 3000);
  };

  const handleNewGame = () => {
    setLoading(true);
    setIsSpinning(false);
    setShowResults(false);
    setPrizeClaimed(false);
    createNewGame();
    setLoading(false);
  };

  const handleClaimPrize = () => {
    setPrizeClaimed(true);
  };

  const winner = players.find((p) => p.is_winner);
  const losers = players.filter((p) => !p.is_winner);

  useEffect(() => {
    createNewGame();
    setLoading(false);
  }, []);

  const totalPrizePool = players.reduce(
    (sum, player) => sum + Number(player.bet_amount),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Dices className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              MemeCoin Casino
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-400">
            Predict the price. Closest wins all!
          </p>
        </div>

        <GameInfo
          game={currentGame}
          players={players}
          totalPrizePool={totalPrizePool}
        />

        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 mb-6 border-2 border-gray-700 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-base sm:text-lg text-gray-400 mb-4">
              {currentGame?.memecoin_symbol} Price
            </h2>
            <SlotMachine
              finalPrice={currentGame?.actual_price || 0}
              isSpinning={isSpinning}
              onSpinComplete={() => setIsSpinning(false)}
            />
          </div>

          {showResults && currentGame?.actual_price && (
            <div className="mt-6 bg-green-900/30 border-2 border-green-700 rounded-xl p-4 text-center">
              <p className="text-lg sm:text-xl font-bold text-green-400">
                Game Complete! Actual Price: $
                {currentGame.actual_price.toFixed(5)}
              </p>
              <p className="text-sm text-gray-300 mt-2">
                Winner receives {totalPrizePool} tokens!
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <BetForm
            onSubmitBet={handleSubmitBet}
            isDisabled={currentGame?.status !== "waiting"}
            memecoinSymbol={currentGame?.memecoin_symbol || "DOGE"}
          />

          <PlayersList
            players={players}
            actualPrice={currentGame?.actual_price || null}
            showResults={showResults}
          />
        </div>

        {currentGame?.status === "completed" && showResults && (
          <ClaimWinner
            winner={winner || null}
            losers={losers}
            totalPrize={totalPrizePool}
            onClaim={handleClaimPrize}
            claimed={prizeClaimed}
          />
        )}

        {currentGame?.status === "completed" && prizeClaimed && (
          <button
            onClick={handleNewGame}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Start New Game
          </button>
        )}
      </div>
    </div>
  );
}

export default Game;
