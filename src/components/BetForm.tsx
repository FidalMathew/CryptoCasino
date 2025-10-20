import { useState } from "react";
import { Wallet, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import type { Game } from "@/types/game";
import { formatEther, Hex, parseEther } from "viem";
import useGlobalContext from "@/context/useGlobalContext";
import { useParams } from "react-router-dom";
import { gameabi } from "@/lib/abi";
import { Delegation } from "@/utils/Delegation";
import { useAccount } from "wagmi";

interface BetFormProps {
  onSubmitBet: (game: Game) => void;
  game: Game | null;
  delegation: Delegation | null;
}

export const BetForm = ({ onSubmitBet, game, delegation }: BetFormProps) => {
  const { id } = useParams();
  const [predictedPrice, setPredictedPrice] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const {
    account,
    publicClient,
    walletClient,
    CONTRACT_ADDRESS,
    handleConnect,
  } = useGlobalContext();
  const { address: wagmiAddress, isConnected } = useAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !wagmiAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!predictedPrice || parseFloat(predictedPrice) <= 0) {
      toast.error("Please enter a valid price prediction");
      return;
    }

    if (!game) {
      toast.error("No active game");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmBet = async () => {
    if (!game || !walletClient || !publicClient || !CONTRACT_ADDRESS) {
      toast.error("Missing required dependencies");
      return;
    }

    if (!wagmiAddress) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      toast.loading("Placing bet...");

      // Call the joinGame function with the predicted price
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as Hex,
        abi: gameabi,
        functionName: "joinGame",
        args: [BigInt(id || game.id), parseEther(predictedPrice)],
        account: account!,
        chain: walletClient.chain,
      });

      await publicClient.waitForTransactionReceipt({ hash: tx });

      toast.dismiss();
      toast.loading("Setting up delegation...");

      // Add player to delegation and sign delegation
      if (delegation) {
        try {
          await delegation.addPlayerSmartAccount(wagmiAddress as Hex);
          toast.dismiss();
          toast.success("Bet placed and delegation signed successfully!");
        } catch (delegationError) {
          console.error("Delegation error:", delegationError);
          toast.dismiss();
          toast.warning(
            "Bet placed but delegation setup failed. Please try again later."
          );
        }
      } else {
        toast.dismiss();
        toast.success("Bet placed successfully!");
      }

      onSubmitBet(game);
      setPredictedPrice("");
      setShowConfirmModal(false);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to place bet");
      console.error(error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-gray-700 relative">
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Confirm Your Bet</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Your Prediction</p>
                <p className="text-2xl font-bold text-white">
                  ${predictedPrice}
                </p>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Bet Amount</p>
                <p className="text-2xl font-bold text-green-400">
                  {game?.fixedBetAmount
                    ? formatEther(game.fixedBetAmount)
                    : "0"}{" "}
                  tokens
                </p>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <p className="text-sm text-yellow-400 leading-relaxed">
                  By confirming, you authorize the smart contract to deduct{" "}
                  {game?.fixedBetAmount
                    ? formatEther(game.fixedBetAmount)
                    : "0"}{" "}
                  tokens if you lose.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBet}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg"
              >
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}

      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 sm:py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
        >
          <Wallet className="w-5 h-5" />
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
            <p className="text-sm font-mono text-green-400">
              {wagmiAddress?.slice(0, 7)}...{wagmiAddress?.slice(-6)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bet Amount (Tokens)
              </label>
              <input
                type="text"
                value={
                  game?.fixedBetAmount
                    ? formatEther(game.fixedBetAmount).toString()
                    : "0"
                }
                disabled={true}
                className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Predict {game?.symbol || "COIN"} Price (USD)
              </label>
              <input
                type="number"
                value={predictedPrice}
                onChange={(e) => setPredictedPrice(e.target.value)}
                placeholder="0.000000"
                step="0.000001"
                min="0"
                className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                disabled={!game?.active || game?.resolved}
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter price in USD (e.g., 123.456789)
              </p>
            </div>

            <button
              type="submit"
              disabled={!game?.active || game?.resolved}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 sm:py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
            >
              <TrendingUp className="w-5 h-5" />
              {!game?.active || game?.resolved
                ? "Game Ended"
                : "Place Bet & Sign Delegation"}
            </button>
          </form>

          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
            <p className="text-xs text-yellow-400 leading-relaxed">
              By placing a bet, you authorize the smart contract to deduct your
              bet amount if you lose. The winner takes all!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
