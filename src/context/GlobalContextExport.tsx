import { createContext } from "react";
import { Account, PublicClient, WalletClient } from "viem";
import { Game } from "../types/game";

interface GlobalContextProps {
  account?: Account;
  CONTRACT_ADDRESS?: string;
  publicClient?: PublicClient;
  walletClient?: WalletClient;
  game?: Game[];
  joinGame?: (
    gameId: string,
    playerName: string,
    predictedPrice: number
  ) => Promise<void>;
  getGameFromId?: (id: string) => Promise<Game | undefined>;
  farcasterAccount?: string | null;
  setFarcasterAccount?: (account: string | null) => void;
}

export const GlobalContext = createContext<GlobalContextProps>({
  account: undefined,
  CONTRACT_ADDRESS: undefined,
  publicClient: undefined,
  walletClient: undefined,
  game: undefined,
  joinGame: async () => {},
  getGameFromId: async () => undefined,
  farcasterAccount: null,
  setFarcasterAccount: () => {},
});
