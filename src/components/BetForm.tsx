import { useState } from "react";
import { Wallet, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";

interface BetFormProps {
  onSubmitBet: (
    betAmount: number,
    predictedPrice: number,
    signature: string
  ) => void;
  isDisabled: boolean;
  memecoinSymbol: string;
}

export const BetForm = ({
  onSubmitBet,
  isDisabled,
  memecoinSymbol,
}: BetFormProps) => {
  const [betAmount, setBetAmount] = useState("10");
  const [predictedPrice, setPredictedPrice] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleConnect = async () => {
    const mockAddress = `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`;
    setWalletAddress(mockAddress);
    setIsConnected(true);
    toast.success("Wallet connected successfully!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!predictedPrice || parseFloat(predictedPrice) <= 0) {
      toast.error("Please enter a valid price prediction");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmBet = () => {
    const mockSignature = `sig_${Math.random().toString(36).substr(2, 9)}`;

    onSubmitBet(
      parseFloat(betAmount),
      parseFloat(predictedPrice),
      mockSignature
    );
    setPredictedPrice("");
    setShowConfirmModal(false);
    toast.success("Bet placed successfully!");
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
                  {betAmount} tokens
                </p>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <p className="text-sm text-yellow-400 leading-relaxed">
                  By confirming, you authorize the smart contract to deduct{" "}
                  {betAmount} tokens if you lose.
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
            <p className="text-sm font-mono text-green-400">{walletAddress}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bet Amount (Tokens)
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min="1"
                step="1"
                className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isDisabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Predict {memecoinSymbol} Price
              </label>
              <input
                type="number"
                value={predictedPrice}
                onChange={(e) => setPredictedPrice(e.target.value)}
                placeholder="0.00000"
                step="0.00001"
                min="0"
                className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isDisabled}
              />
            </div>

            <button
              type="submit"
              disabled={isDisabled}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 sm:py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
            >
              <TrendingUp className="w-5 h-5" />
              {isDisabled ? "Game Started" : "Place Bet & Sign Delegation"}
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
