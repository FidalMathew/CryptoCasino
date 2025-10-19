import { useEffect, useState } from "react";

interface SlotMachineProps {
  finalPrice: number;
  isSpinning: boolean;
  onSpinComplete?: () => void;
}

export const SlotMachine = ({
  finalPrice,
  isSpinning,
  onSpinComplete,
}: SlotMachineProps) => {
  const [displayPrice, setDisplayPrice] = useState("0.00000");
  const [spinCount, setSpinCount] = useState(0);

  useEffect(() => {
    if (isSpinning) {
      setSpinCount(0);
      const interval = setInterval(() => {
        const randomPrice = (Math.random() * 0.5).toFixed(5);
        setDisplayPrice(randomPrice);
        setSpinCount((prev) => prev + 1);
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setDisplayPrice(finalPrice.toFixed(5));
        onSpinComplete?.();
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setDisplayPrice(finalPrice.toFixed(5));
    }
  }, [isSpinning, finalPrice, onSpinComplete]);

  const digits = displayPrice.split("");

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {digits.map((digit, index) => (
        <div
          key={index}
          className={`
            ${digit === "." ? "w-3 sm:w-4" : "w-10 sm:w-16 md:w-20"}
            h-14 sm:h-20 md:h-24
            ${
              digit === "."
                ? "flex items-end pb-2 sm:pb-3"
                : "bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-lg border-2 border-gray-700"
            }
            flex items-center justify-center
            ${isSpinning && digit !== "." ? "animate-pulse" : ""}
          `}
        >
          <span
            className={`
              font-bold text-yellow-400
              ${
                digit === "."
                  ? "text-3xl sm:text-4xl md:text-5xl"
                  : "text-2xl sm:text-4xl md:text-5xl"
              }
              ${isSpinning && digit !== "." ? "blur-sm" : ""}
              transition-all duration-100
            `}
            style={{
              textShadow: "0 0 10px rgba(250, 204, 21, 0.5)",
            }}
          >
            {digit}
          </span>
        </div>
      ))}
    </div>
  );
};
