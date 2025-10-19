import { useState } from "react";
import { X, TrendingUp } from "lucide-react";

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playerName: string, predictedPrice: number) => void;
  memecoinSymbol: string;
  betAmount: number;
}

export function BetModal({
  isOpen,
  onClose,
  onSubmit,
  memecoinSymbol,
  betAmount,
}: BetModalProps) {
  const [playerName, setPlayerName] = useState("");
  const [predictedPrice, setPredictedPrice] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    const price = parseFloat(predictedPrice);
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price prediction");
      return;
    }

    onSubmit(playerName.trim(), price);
    setPlayerName("");
    setPredictedPrice("");
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-md w-full border-2 border-yellow-600 max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-1.5 sm:p-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Place Your Bet
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="bg-gray-950/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">
                Memecoin:
              </span>
              <span className="text-base sm:text-lg font-bold text-white">
                {memecoinSymbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-400">
                Bet Amount:
              </span>
              <span className="text-base sm:text-lg font-bold text-yellow-400">
                {betAmount} TOK
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-gray-950/50 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors text-sm sm:text-base"
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">
                Price Prediction (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg">
                  $
                </span>
                <input
                  type="text"
                  value={predictedPrice}
                  onChange={(e) => setPredictedPrice(e.target.value)}
                  className="w-full bg-gray-950/50 border border-gray-700 rounded-lg pl-7 sm:pl-8 pr-3 sm:pr-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors text-sm sm:text-base"
                  placeholder="0.0000000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                Enter your predicted price for {memecoinSymbol}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-2.5 sm:p-3">
                <p className="text-xs sm:text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5 sm:p-3">
              <p className="text-xs text-gray-300">
                <span className="font-semibold text-yellow-400">Note:</span> The
                player with the closest prediction to the actual price wins the
                pot!
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 active:scale-95 text-gray-900 font-bold py-3 sm:py-4 rounded-lg transition-all transform sm:hover:scale-105 shadow-lg text-sm sm:text-base"
            >
              Confirm Bet
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
