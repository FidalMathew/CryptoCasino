import { createContext } from "react";
import { Account, PublicClient, WalletClient } from "viem";
import { Game } from "../types/game";

interface GlobalContextProps {
  account?: Account | undefined;
  CONTRACT_ADDRESS?: string;
  publicClient?: PublicClient;
  walletClient?: WalletClient;
  game?: Game[];
  joinGame?: (gameId: string) => Promise<void>;
  getGameFromId?: (id: string) => Promise<Game | undefined>;
  resolveGame?: (gameId: string) => Promise<void>;
  farcasterAccount?: string | null;
  setFarcasterAccount?: (account: string | null) => void;
  handleConnect?: () => Promise<void>;
}

export const GlobalContext = createContext<GlobalContextProps>({
  account: undefined,
  CONTRACT_ADDRESS: undefined,
  publicClient: undefined,
  walletClient: undefined,
  game: undefined,
  joinGame: async () => {},
  getGameFromId: async () => undefined,
  resolveGame: async () => {},
  farcasterAccount: null,
  setFarcasterAccount: () => {},
  handleConnect: async () => {},
});
