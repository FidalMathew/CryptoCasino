import {
  createDelegation,
  createExecution,
  DeleGatorEnvironment,
  ExecutionMode,
  getDeleGatorEnvironment,
  Implementation,
  toMetaMaskSmartAccount,
  type Delegation as DelegationType,
  type MetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { DelegationManager } from "@metamask/delegation-toolkit/contracts";
import axios from "axios";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  http,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const BOB_PRIVATE_KEY = import.meta.env.VITE_DELEGATOR_PRIVATE_KEY! as Hex;
const bobAccount = privateKeyToAccount(BOB_PRIVATE_KEY);

const JayTokenAddress = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43" as Hex;
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export class Delegation {
  private publicClient: PublicClient;
  private chain: Chain;
  private environment: DeleGatorEnvironment;
  private gameId: number;

  private playerAddresses: Address[];
  private playerSmartAccounts: Map<Address, MetaMaskSmartAccount> = new Map();

  constructor(chain: Chain, playerAddresses: Address[], gameId: number) {
    const publicClient = createPublicClient({
      chain: chain,
      transport: http(),
    });

    this.publicClient = publicClient;
    this.chain = chain;
    this.playerAddresses = playerAddresses;
    this.environment = getDeleGatorEnvironment(this.chain.id);
    this.gameId = gameId;

    this.initializeAccounts();
  }

  private async initializeAccounts() {
    if (this.playerAddresses.length === 0) {
      console.log("No players to initialize accounts for.");
      return;
    }
    // Initialize smart accounts for all players
    for (const playerAddress of this.playerAddresses) {
      const playerSmartAccount = await toMetaMaskSmartAccount({
        client: this.publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [playerAddress, [], [], []],
        deploySalt: "0x",
        signer: { account: playerAddress as any }, // Note: You'll need the actual signer
      });

      await this.deploySmartAccountIfNeeded(
        playerSmartAccount,
        `Player ${playerAddress.slice(0, 6)}`
      );

      this.playerSmartAccounts.set(playerAddress, playerSmartAccount);
    }

    console.log("All accounts initialized");
  }

  async addPlayerSmartAccount(playerAddress: Address) {
    // Check if player already joined
    if (this.playerSmartAccounts.has(playerAddress)) {
      throw new Error("Player has already joined the game");
    }

    console.log(`Player ${playerAddress.slice(0, 6)} joining game...`);

    // Create smart account for the new player
    const playerSmartAccount = await toMetaMaskSmartAccount({
      client: this.publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [playerAddress, [], [], []],
      deploySalt: "0x",
      signer: { account: playerAddress as any }, // Note: You'll need the actual signer
    });

    // Deploy smart account if needed
    await this.deploySmartAccountIfNeeded(
      playerSmartAccount,
      `Player ${playerAddress.slice(0, 6)}`
    );

    // Create delegation from player to Bob
    const delegation = createDelegation({
      to: bobAccount.address, // Bob's EOA (delegate)
      from: playerSmartAccount.address, // Player's smart account
      environment: this.environment,
      scope: {
        type: "functionCall",
        targets: [JayTokenAddress],
        selectors: [
          "approve(address, uint256)",
          "transferFrom(address,address,uint256)",
          "transfer(address,uint256)",
        ],
      },
    });

    // Sign the delegation
    const signature = await playerSmartAccount.signDelegation({
      delegation,
    });

    // Add player to the game
    this.playerAddresses.push(playerAddress);
    this.playerSmartAccounts.set(playerAddress, playerSmartAccount);

    console.log(`Player ${playerAddress.slice(0, 6)} successfully joined!`);
    console.log(`Smart Account: ${playerSmartAccount.address}`);

    const tempDelegation = {
      ...delegation,
      signature,
    };

    // add todo in backend app.post("/api/todos",

    await axios.post(`${backendUrl}/api/todos`, {
      gameId: this.gameId,
      text: JSON.stringify(tempDelegation), // better than toString()
    });

    return {
      playerAddress,
      smartAccountAddress: playerSmartAccount.address,
      delegation: {
        ...delegation,
        signature,
      },
    };
  }

  private async deploySmartAccountIfNeeded(
    smartAccount: MetaMaskSmartAccount,
    name: string
  ) {
    const code = await this.publicClient.getCode({
      address: smartAccount.address,
    });

    if (!code) {
      console.log(`Deploying ${name}'s Smart Account...`);
      const { factory, factoryData } = await smartAccount.getFactoryArgs();

      const walletClient = createWalletClient({
        account: bobAccount,
        chain: this.chain,
        transport: http(),
      });

      const hash = await walletClient.sendTransaction({
        to: factory as Hex,
        data: factoryData as Hex,
        account: bobAccount,
        chain: this.chain,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`${name}'s Smart Account deployed`);
    }
  }

  async createDelegationsForAllPlayers() {
    const delegations: Array<DelegationType & { signature: Hex }> = [];

    for (const [playerAddress, playerSmartAccount] of this
      .playerSmartAccounts) {
      const delegation = createDelegation({
        to: bobAccount.address, // Bob's EOA (delegate)
        from: playerSmartAccount.address, // Player's smart account
        environment: this.environment,
        scope: {
          type: "functionCall",
          targets: [JayTokenAddress],
          selectors: [
            "approve(address, uint256)",
            "transferFrom(address,address,uint256)",
            "transfer(address,uint256)",
          ],
        },
      });

      const signature = await playerSmartAccount.signDelegation({
        delegation,
      });

      delegations.push({
        ...delegation,
        signature,
      });

      console.log(`Delegation signed for player: ${playerAddress}`);
    }

    return delegations;
  }

  async redeemAndSendToWinner(winnerAddress: Address, amount: bigint) {
    // const delegations = await this.createDelegationsForAllPlayers();

    // Group delegations per player
    // const signedDelegations = delegations.map((d) => [d]);

    const gameId = this.gameId; // Replace with actual game ID
    const res = await axios.get(`${backendUrl}/api/todos/game/${gameId}`);

    const todos = res.data;

    const tempDelgations = todos.map((todo: any) => {
      return JSON.parse(todo.text);
    });

    const signedDelegations = tempDelgations.map((d: any) => [d]);

    // Create execution to transfer tokens to winner
    const executions = [
      createExecution({
        target: JayTokenAddress,
        callData: encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [winnerAddress, amount],
        }),
        value: 0n,
      }),
    ];

    const redeemDelegationCalldata = DelegationManager.encode.redeemDelegations(
      {
        delegations: signedDelegations,
        modes: signedDelegations.map(() => ExecutionMode.SingleDefault),
        executions: signedDelegations.map(() => executions),
      }
    );

    // Log balances before
    console.log("Balances before redeeming:");
    for (const [address, smartAccount] of this.playerSmartAccounts) {
      const balance = await this.publicClient.readContract({
        address: JayTokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [smartAccount.address],
      });
      console.log(`Player ${address.slice(0, 6)}: ${balance}`);
    }

    console.log("Redeeming delegations...");

    const bobsWalletClient = createWalletClient({
      chain: this.chain,
      account: bobAccount,
      transport: http(`https://ethereum-monadTestnet-rpc.publicnode.com`),
    });

    const transactionHash = await bobsWalletClient.sendTransaction({
      to: this.environment.DelegationManager,
      data: redeemDelegationCalldata,
      chain: this.chain,
    });

    await this.publicClient.waitForTransactionReceipt({
      hash: transactionHash,
    });

    console.log("Delegation redeemed in transaction:", transactionHash);

    // Log balances after
    const winnerBalance = await this.publicClient.readContract({
      address: JayTokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [winnerAddress],
    });

    console.log(`Winner ${winnerAddress} balance: ${winnerBalance}`);

    return transactionHash;
  }
}
