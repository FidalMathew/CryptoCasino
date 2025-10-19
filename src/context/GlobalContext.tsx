import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { createConfig, http } from "wagmi";
import { ReactNode, useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  PublicClient,
  WalletClient,
} from "viem";
import { gameabi } from "@/lib/abi";
import { GlobalContext } from "./GlobalContextExport";
import { gameAbi } from "@/lib/gameAbi";
import { Game } from "@/types/game";

const account = privateKeyToAccount(import.meta.env.VITE_PRIVATE_KEY!);
const CONTRACT_ADDRESS = "0xE6D80c970648929CA033cB663bBab587EA105eEd";

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
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

  useEffect(() => {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    setPublicClient(publicClient);

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    });

    setWalletClient(walletClient);
  }, [account]);

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

      const allGames = await Promise.all(gameDataPromises);
      console.log(allGames, "all games fetched");
      setGame(allGames as Game[]);
    })();
  }, [publicClient, walletClient]);

  const joinGame = async () => {
    if (!walletClient) return;
    if (!publicClient) return;

    const tx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: gameabi,
      functionName: "joinGame",
      args: [1],
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

  return (
    <GlobalContext.Provider
      value={{
        account,
        CONTRACT_ADDRESS,
        publicClient,
        walletClient,

        game,
        joinGame,
        getGameFromId,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}
