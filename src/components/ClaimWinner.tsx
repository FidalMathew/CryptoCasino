import { useState } from "react";
import { Trophy, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { PlayerBet } from "../types/game";

interface ClaimWinnerProps {
  winner: PlayerBet | null;
  losers: PlayerBet[];
  totalPrize: number;
  onClaim: () => void;
  claimed: boolean;
}

interface TransactionStep {
  from: string;
  to: string;
  amount: number;
  status: "pending" | "processing" | "completed";
  txHash?: string;
  type?: "collect" | "distribute";
}

interface BettingManagerStep {
  phase: "collecting" | "distributing" | "completed";
  currentAmount: number;
  message: string;
}

export const ClaimWinner = ({
  winner,
  losers,
  totalPrize,
  onClaim,
  claimed,
}: ClaimWinnerProps) => {
  const [claiming, setClaiming] = useState(false);
  const [transactions, setTransactions] = useState<TransactionStep[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [bettingManagerStep, setBettingManagerStep] =
    useState<BettingManagerStep | null>(null);

  if (!winner) return null;

  const handleClaim = async () => {
    setClaiming(true);
    setShowDetails(true);

    // Calculate total amount: number of losers * 0.0001 token
    const tokenPerPlayer = 0.0001;
    const totalAmountToCollect = losers.length * tokenPerPlayer;

    // Phase 1: Betting Manager collects from losers
    setBettingManagerStep({
      phase: "collecting",
      currentAmount: 0,
      message: "Betting Manager collecting tokens from losers...",
    });

    const collectSteps: TransactionStep[] = losers.map((loser) => ({
      from: loser.player_name,
      to: "Betting Manager",
      amount: tokenPerPlayer,
      status: "pending",
      type: "collect",
    }));

    setTransactions(collectSteps);

    let collectedAmount = 0;

    // Simulate collecting from each loser
    for (let i = 0; i < collectSteps.length; i++) {
      setTransactions((prev) =>
        prev.map((tx, idx) =>
          idx === i ? { ...tx, status: "processing" } : tx
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));

      collectedAmount += tokenPerPlayer;

      setBettingManagerStep({
        phase: "collecting",
        currentAmount: parseFloat(collectedAmount.toFixed(4)),
        message: `Collecting... ${collectedAmount.toFixed(4)}/${totalAmountToCollect.toFixed(4)} tokens`,
      });

      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      setTransactions((prev) =>
        prev.map((tx, idx) =>
          idx === i ? { ...tx, status: "completed", txHash: mockTxHash } : tx
        )
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Phase 2: Betting Manager distributes to winner
    setBettingManagerStep({
      phase: "distributing",
      currentAmount: parseFloat(collectedAmount.toFixed(4)),
      message: `Sending ${collectedAmount.toFixed(4)} tokens to winner...`,
    });

    const distributeStep: TransactionStep = {
      from: "Betting Manager",
      to: winner.player_name,
      amount: parseFloat(collectedAmount.toFixed(4)),
      status: "processing",
      type: "distribute",
    };

    setTransactions((prev) => [...prev, distributeStep]);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const finalTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    setTransactions((prev) =>
      prev.map((tx, idx) =>
        idx === prev.length - 1
          ? { ...tx, status: "completed", txHash: finalTxHash }
          : tx
      )
    );

    setBettingManagerStep({
      phase: "completed",
      currentAmount: parseFloat(collectedAmount.toFixed(4)),
      message: "Transfer completed successfully!",
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    setClaiming(false);
    onClaim();
  };

  if (claimed) {
    return (
      <div className="bg-gradient-to-r from-green-900/40 to-green-800/40 border-2 border-green-600 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
          <h3 className="text-xl sm:text-2xl font-bold text-green-400">
            Prize Claimed Successfully!
          </h3>
        </div>
        <p className="text-center text-gray-300">
          {totalPrize} tokens have been transferred to {winner.player_name}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-2 border-yellow-600 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Trophy className="w-8 h-8 text-yellow-400" />
        <h3 className="text-xl sm:text-2xl font-bold text-yellow-400">
          Winner: {winner.player_name}
        </h3>
      </div>

      <div className="bg-gray-900/60 rounded-lg p-4 mb-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Winner Address:</span>
          <span className="text-white font-mono text-sm">
            0x{winner.player_id.slice(0, 8)}...{winner.player_id.slice(-4)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Predicted Price:</span>
          <span className="text-white font-semibold">
            ${winner.predicted_price.toFixed(6)} USD
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Total Prize:</span>
          <span className="text-yellow-400 font-bold text-lg">
            {totalPrize} tokens
          </span>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 mb-4">
        <p className="text-xs text-blue-300 leading-relaxed">
          Smart contract will use delegated signatures to transfer{" "}
          {losers.length} bet amount{losers.length > 1 ? "s" : ""} from losing
          player{losers.length > 1 ? "s" : ""} to the winner.
        </p>
      </div>

      {/* Betting Manager Status Display */}
      {bettingManagerStep && (
        <div
          className={`border-2 rounded-lg p-4 mb-4 transition-all duration-300 ${
            bettingManagerStep.phase === "collecting"
              ? "bg-blue-900/30 border-blue-600"
              : bettingManagerStep.phase === "distributing"
                ? "bg-purple-900/30 border-purple-600"
                : "bg-green-900/30 border-green-600"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-white">
              {bettingManagerStep.phase === "collecting" &&
                "📥 Collecting Phase"}
              {bettingManagerStep.phase === "distributing" &&
                "📤 Distribution Phase"}
              {bettingManagerStep.phase === "completed" && "✅ Completed"}
            </h4>
            <span className="text-yellow-400 font-bold text-lg">
              {bettingManagerStep.currentAmount} tokens
            </span>
          </div>
          <p className="text-xs text-gray-300">{bettingManagerStep.message}</p>
          {bettingManagerStep.phase === "collecting" && (
            <div className="mt-2 bg-gray-900/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{
                  width: `${(bettingManagerStep.currentAmount / totalPrize) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {showDetails && transactions.length > 0 && (
        <div className="bg-gray-900/80 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            Transaction Details:
          </h4>
          <div className="space-y-2">
            {transactions.map((tx, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-2 rounded ${
                  tx.status === "completed"
                    ? "bg-green-900/30"
                    : tx.status === "processing"
                      ? "bg-blue-900/30"
                      : "bg-gray-800/30"
                }`}
              >
                {tx.status === "completed" && (
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
                {tx.status === "processing" && (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                )}
                {tx.status === "pending" && (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-600 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-300 truncate">{tx.from}</span>
                    <ArrowRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-300 truncate">{tx.to}</span>
                  </div>
                  {tx.txHash && (
                    <p className="text-xs text-gray-500 font-mono truncate mt-1">
                      {tx.txHash.slice(0, 16)}...
                    </p>
                  )}
                </div>

                <span className="text-yellow-400 font-semibold text-xs flex-shrink-0">
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={claiming}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
      >
        {claiming ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Transactions...
          </>
        ) : (
          <>
            <Trophy className="w-5 h-5" />
            Claim Prize & Execute Transfers
          </>
        )}
      </button>
    </div>
  );
};
