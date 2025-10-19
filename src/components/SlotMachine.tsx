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
  const [displayPrice, setDisplayPrice] = useState("000000.0000");

  const formatPrice = (price: number): string => {
    // Ensure the price has exactly 6 digits before and 4 digits after decimal
    const formatted = price.toFixed(4);
    const [integerPart, decimalPart] = formatted.split(".");
    // Pad integer part with leading zeros to make it 6 digits
    const paddedInteger = integerPart.padStart(6, "0");
    return `${paddedInteger}.${decimalPart}`;
  };

  useEffect(() => {
    if (isSpinning) {
      const interval = setInterval(() => {
        const randomPrice = Math.random() * 999999.9999;
        setDisplayPrice(formatPrice(randomPrice));
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setDisplayPrice(formatPrice(finalPrice));
        onSpinComplete?.();
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setDisplayPrice(formatPrice(finalPrice));
    }
  }, [isSpinning, finalPrice, onSpinComplete]);

  const digits = displayPrice.split("");

  return (
    <div className="flex items-center justify-center gap-0.5 sm:gap-1">
      {digits.map((digit, index) => (
        <div
          key={index}
          className={`
            ${digit === "." ? "w-2 sm:w-3" : "w-8 sm:w-12 md:w-16"}
            h-12 sm:h-16 md:h-20
            ${
              digit === "."
                ? "flex items-end pb-2 sm:pb-3"
                : "bg-gradient-to-b from-gray-800 to-gray-900 rounded-md shadow-lg border-2 border-gray-700"
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
                  ? "text-2xl sm:text-3xl md:text-4xl"
                  : "text-xl sm:text-3xl md:text-4xl"
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
