import { sepolia } from "viem/chains";
import { createConfig, http, useConnect, useAccount } from "wagmi";
import { ReactNode, useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  Hex,
  PublicClient,
  WalletClient,
} from "viem";
import { toast } from "sonner";
import { gameabi } from "@/lib/abi";
import { GlobalContext } from "./GlobalContextExport";
import { gameAbi } from "@/lib/gameAbi";
import { Game } from "@/types/game";
import { privateKeyToAccount } from "viem/accounts";

const CONTRACT_ADDRESS = "0x9f9224dbcf2c5d050c5c95fA87da5ce7CFAc8952";
const account = privateKeyToAccount(import.meta.env.VITE_PRIVATE_KEY1 as Hex);

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(`https://ethereum-sepolia-rpc.publicnode.com`),
  },
});

export default function GlobalContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [publicClient, setPublicClient] = useState<PublicClient | undefined>();
  const [walletClient, setWalletClient] = useState<WalletClient | undefined>();
  const [game, setGame] = useState<Game[] | undefined>();
  const [farcasterAccount, setFarcasterAccount] = useState<string | null>(null);
  const { connectors, connect } = useConnect();
  const { connector } = useAccount();

  useEffect(() => {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(`https://ethereum-sepolia-rpc.publicnode.com`),
    });

    setPublicClient(publicClient);

    if (account && connector) {
      const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(`https://ethereum-sepolia-rpc.publicnode.com`),
      });

      setWalletClient(walletClient);
    }
  }, [account, connector]);

  useEffect(() => {
    if (!publicClient || !walletClient) return;

    (async function () {
      const nextGameIdRaw = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: gameabi,
        functionName: "nextGameId",
      });

      // readContract returns unknown, cast to bigint (uint256) then convert to number for the loop
      const nextGameId = Number(nextGameIdRaw as bigint);

      if (nextGameId === 0) return;

      const gameDataPromises = Array.from({ length: nextGameId }, (_, i) =>
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: gameabi,
          functionName: "getGameState",
          args: [BigInt(i)],
        })
      );

      const allGamesRaw = await Promise.all(gameDataPromises);
      console.log(allGamesRaw, "all games raw data fetched");

      // Transform tuple arrays into proper Game objects
      const transformedGames: Game[] = allGamesRaw.map((gameData, index) => {
        const [
          symbol,
          startAt,
          joinEndsAt,
          endsAt,
          active,
          resolved,
          fixedBetAmount,
          totalPool,
          winner,
          finalPrice,
        ] = gameData as [
          string,
          bigint,
          bigint,
          bigint,
          boolean,
          boolean,
          bigint,
          bigint,
          string,
          bigint,
        ];

        return {
          id: index.toString(),
          symbol,
          startAt,
          joinEndsAt,
          endsAt,
          active,
          resolved,
          fixedBetAmount,
          totalPool,
          winner,
          finalPrice,
          bets: [], // Bets will be loaded when viewing individual game
        };
      });

      console.log(transformedGames, "transformed games");
      setGame(transformedGames);
    })();
  }, [publicClient, walletClient]);

  const joinGame = async (gameId: string) => {
    if (!walletClient) return;
    if (!publicClient) return;
    if (!account) return;

    const tx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: gameabi,
      functionName: "joinGame",
      args: [gameId],
      account,
      chain: sepolia,
    });

    await publicClient.waitForTransactionReceipt({ hash: tx });
  };

  const getGameFromId = async (id: string) => {
    if (!publicClient) return;

    const [
      symbol,
      startAt,
      joinEndsAt,
      endsAt,
      active,
      resolved,
      fixedBetAmount,
      totalPool,
      winner,
      finalPrice,
    ] = (await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: gameAbi,
      functionName: "getGameState",
      args: [BigInt(id)],
    })) as [
      string,
      bigint,
      bigint,
      bigint,
      boolean,
      boolean,
      bigint,
      bigint,
      string,
      bigint,
    ];

    const fetchedPlayersForGame = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: gameAbi,
      functionName: "getPlayers",
      args: [Number(id)],
    });

    const bets = await Promise.all(
      (fetchedPlayersForGame as any[]).map(async (playerAddress: string) => {
        const [guessPrice, joined, claimed] = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: gameAbi,
          functionName: "getPlayerGuess",
          args: [BigInt(id), playerAddress],
        })) as [bigint, boolean, boolean];

        return { player: playerAddress, guessPrice, joined, claimed };
      })
    );

    return {
      id,
      symbol,
      startAt,
      joinEndsAt,
      endsAt,
      active,
      resolved,
      fixedBetAmount,
      totalPool,
      winner,
      finalPrice,
      bets,
    };
  };

  const resolveGame = async (gameId: string) => {
    if (!walletClient || !publicClient || !account) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      toast.loading(`Resolving game ${gameId}...`);

      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: gameabi,
        functionName: "resolveGame",
        args: [BigInt(gameId)],
        account: account,
        chain: sepolia,
      });

      await publicClient.waitForTransactionReceipt({ hash: tx });

      toast.dismiss();
      toast.success("Game resolved successfully!");

      // Refresh games list
      const updatedGame = await getGameFromId(gameId);
      if (updatedGame && game) {
        const updatedGames = game.map((g) =>
          g.id === gameId ? (updatedGame as Game) : g
        );
        setGame(updatedGames);
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error resolving game:", error);
      toast.error("Failed to resolve game");
    }
  };

  const handleConnect = async () => {
    try {
      if (connectors.length === 0) {
        toast.error("No wallet connectors available");
        return;
      }

      await connect({ connector: connectors[0] });
      toast.success("Wallet connected successfully!");
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet");
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        account,
        CONTRACT_ADDRESS,
        publicClient,
        walletClient,

        farcasterAccount,
        setFarcasterAccount,
        game,
        joinGame,
        getGameFromId,
        resolveGame,

        handleConnect,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}
