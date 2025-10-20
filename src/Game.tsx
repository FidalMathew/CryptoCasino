import { useEffect, useState } from "react";
import { Dices, RefreshCw, ArrowLeft } from "lucide-react";
import { type Game as GameType, PlayerBet } from "./types/game";
import { SlotMachine } from "./components/SlotMachine";
import { BetForm } from "./components/BetForm";
import { GameInfo } from "./components/GameInfo";
import { PlayersList } from "./components/PlayersList";
import { ClaimWinner } from "./components/ClaimWinner";
import useGlobalContext from "./context/useGlobalContext";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Delegation } from "./utils/Delegation";
import { sepolia } from "viem/chains";
import type { Address, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(import.meta.env.VITE_PRIVATE_KEY as Hex);
const account1 = privateKeyToAccount(import.meta.env.VITE_PRIVATE_KEY1 as Hex);

function Game() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState<GameType | null>(null);
  const [players, setPlayers] = useState<PlayerBet[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prizeClaimed, setPrizeClaimed] = useState(false);
  const [delegation, setDelegation] = useState<Delegation | null>(null);
  const { getGameFromId, publicClient, walletClient } = useGlobalContext();

  useEffect(() => {
    if (!getGameFromId || !id) return;

    const fetchGame = async () => {
      try {
        const gameData = await getGameFromId(id);
        if (gameData) {
          setGame(gameData as GameType);

          // Convert bets to PlayerBet format
          const playerBets: PlayerBet[] = gameData.bets.map(
            (bet: any, index: number) => ({
              id: `bet-${index}`,
              game_id: id,
              player_id: bet.player,
              player_name: `${bet.player.slice(0, 6)}...${bet.player.slice(-4)}`,
              predicted_price: Number(bet.guessPrice) / 1e18,
              bet_amount: Number(gameData.fixedBetAmount) / 1e18,
              delegation_signature: null,
              is_winner: gameData.winner === bet.player,
              payout_amount:
                gameData.winner === bet.player
                  ? Number(gameData.totalPool) / 1e18
                  : 0,
              created_at: new Date().toISOString(),
            })
          );

          setPlayers(playerBets);
          setShowResults(gameData.resolved);

          // Initialize Delegation class with all player addresses
          const playerAddresses = gameData.bets.map(
            (bet: any) => bet.player as Address
          );
          if (playerAddresses.length > 0) {
            const delegationInstance = new Delegation(
              sepolia,
              playerAddresses,
              Number(id)
            );
            setDelegation(delegationInstance);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching game:", error);
        toast.error("Failed to load game");
        setLoading(false);
      }
    };

    fetchGame();

    // Set up polling to refresh game data
    const interval = setInterval(fetchGame, 5000);
    return () => clearInterval(interval);
  }, [getGameFromId, id, publicClient]);

  const handleSubmitBet = async (_gameData: GameType) => {
    // Refresh game data after bet is placed
    if (!getGameFromId || !id) return;

    try {
      const updatedGame = await getGameFromId(id);
      if (updatedGame) {
        setGame(updatedGame as GameType);

        const playerBets: PlayerBet[] = updatedGame.bets.map(
          (bet: any, index: number) => ({
            id: `bet-${index}`,
            game_id: id,
            player_id: bet.player,
            player_name: `${bet.player.slice(0, 6)}...${bet.player.slice(-4)}`,
            predicted_price: Number(bet.guessPrice) / 1e18,
            bet_amount: Number(updatedGame.fixedBetAmount) / 1e18,
            delegation_signature: null,
            is_winner: updatedGame.winner === bet.player,
            payout_amount:
              updatedGame.winner === bet.player
                ? Number(updatedGame.totalPool) / 1e18
                : 0,
            created_at: new Date().toISOString(),
          })
        );

        setPlayers(playerBets);

        // Update delegation with new players
        const playerAddresses = updatedGame.bets.map(
          (bet: any) => bet.player as Address
        );
        if (playerAddresses.length > 0) {
          // Create new delegation instance or update existing one
          const delegationInstance = new Delegation(
            sepolia,
            playerAddresses,
            Number(id)
          );
          setDelegation(delegationInstance);
        }
      }
    } catch (error) {
      console.error("Error refreshing game:", error);
    }
  };

  const handleNewGame = () => {
    navigate("/");
  };

  const handleClaimPrize = async () => {
    if (!delegation || !winner || !game || !walletClient) {
      toast.error(
        "Cannot claim prize: Missing delegation or winner information"
      );
      return;
    }

    try {
      toast.loading("Claiming prize...");

      // Send fixed amount: 0.0001 token (in wei)
      // 0.0001 token = 0.0001 * 10^18 wei = 10^14 wei
      const totalAmount = BigInt(100000000000000); // 0.0001 * 10^18

      // Use delegation to redeem and send tokens to winner
      // const txHash = await delegation.redeemAndSendToWinner(
      //   winner.player_id as Address,
      //   totalAmount
      // );

      // Simple transfer from account to account1
      const txHash = await walletClient.sendTransaction({
        account: account,
        to: account1.address,
        value: totalAmount,
        chain: sepolia,
      });

      setPrizeClaimed(true);
      toast.dismiss();
      toast.success(
        `Prize claimed successfully! TX: ${txHash.slice(0, 10)}...`
      );
    } catch (error) {
      console.error("Error claiming prize:", error);
      toast.dismiss();
      toast.error(
        `Failed to claim prize: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const winner = players.find((p) => p.is_winner);
  const losers = players.filter((p) => !p.is_winner);

  const totalPrizePool = game?.totalPool ? Number(game.totalPool) / 1e18 : 0;
  const actualPrice = game?.finalPrice ? Number(game.finalPrice) / 1e8 : null;

  console.log(Number(game?.finalPrice) / 1e8, "final");

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
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Dices className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Crypto Casino
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-400">
            Predict the price. Closest wins all!
          </p>
        </div>

        <GameInfo
          game={{
            id: game?.id || id || "0",
            memecoin_symbol: game?.symbol || "COIN",
            start_time: game?.startAt
              ? new Date(Number(game.startAt) * 1000).toISOString()
              : new Date().toISOString(),
            end_time: game?.endsAt
              ? new Date(Number(game.endsAt) * 1000).toISOString()
              : null,
            actual_price: actualPrice,
            min_players: 2,
            current_players: players.length,
            status: game?.resolved
              ? "completed"
              : game?.active
                ? "active"
                : "waiting",
            created_at: game?.startAt
              ? new Date(Number(game.startAt) * 1000).toISOString()
              : new Date().toISOString(),
          }}
          players={players}
          totalPrizePool={totalPrizePool}
        />

        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 mb-6 border-2 border-gray-700 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-base sm:text-lg text-gray-400 mb-4">
              {game?.symbol || "COIN"} Price (USD)
            </h2>
            <SlotMachine
              finalPrice={actualPrice || 0}
              isSpinning={isSpinning}
              onSpinComplete={() => setIsSpinning(false)}
            />
          </div>

          {showResults && actualPrice !== null && (
            <div className="mt-6 bg-green-900/30 border-2 border-green-700 rounded-xl p-4 text-center">
              <p className="text-lg sm:text-xl font-bold text-green-400">
                Game Complete! Actual Price: ${actualPrice.toFixed(6)} USD
              </p>
              <p className="text-sm text-gray-300 mt-2">
                Winner receives {totalPrizePool} tokens!
              </p>
            </div>
          )}
        </div>

        {/* Show message if game ended without players */}
        {(!game?.active || game?.resolved) && players.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 sm:p-12 mb-6 border-2 border-gray-700 shadow-2xl">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/20 rounded-full mb-4">
                  <Dices className="w-10 h-10 text-yellow-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Game Ended
                </h3>
                <p className="text-gray-400 text-lg mb-6">
                  No players joined this game
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Game Symbol</p>
                    <p className="text-white font-semibold text-lg">
                      {game?.symbol || "COIN"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Status</p>
                    <p className="text-red-400 font-semibold text-lg">
                      {game?.resolved ? "Completed" : "Ended"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Total Players</p>
                    <p className="text-white font-semibold text-lg">0</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Prize Pool</p>
                    <p className="text-white font-semibold text-lg">
                      {totalPrizePool} tokens
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNewGame}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                View All Games
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <BetForm
              onSubmitBet={handleSubmitBet}
              game={game}
              delegation={delegation}
            />

            <PlayersList
              players={players}
              actualPrice={actualPrice}
              showResults={showResults}
            />
          </div>
        )}

        {game?.resolved && showResults && (
          <ClaimWinner
            winner={winner || null}
            losers={losers}
            totalPrize={totalPrizePool}
            onClaim={handleClaimPrize}
            claimed={prizeClaimed}
          />
        )}

        {game?.resolved && prizeClaimed && (
          <button
            onClick={handleNewGame}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Back to Games
          </button>
        )}
      </div>
    </div>
  );
}

export default Game;
