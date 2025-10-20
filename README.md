Here’s a complete, professional **README.md** for your project **CryptoCasino**, written to fit perfectly for hackathon submissions, GitHub, or Devfolio 👇

---

# 🎰 CryptoCasino

**CryptoCasino** is a **Farcaster Mini App** built on the **Monad Testnet** where users predict memecoin prices in real-time.
Players join short rounds by **delegating bets via MetaMask Smart Accounts**, and the winner — whose guess is closest to the actual price — takes the pot.
Prices are fetched securely using **Chainlink Oracles**, ensuring transparency and fairness.

---

## 🚀 Features

- 🎮 **Admin-controlled Game Creation** — Only the admin can create new games with a selected memecoin symbol.
- ⏱️ **Timed Rounds** — Each game lasts **20 minutes**; players can join in the first 10 minutes.
- 💰 **Delegated Bets** — Players delegate a fixed bet amount to the contract using **MetaMask Delegation Framework**.
- 🔗 **Oracle Integration** — Fetches memecoin prices via **Chainlink** for tamper-proof results.
- 🏆 **Automatic Winner Resolution** — The player closest to the final oracle price wins the pooled amount.
- 📊 **Leaderboard System** — Tracks total wins and total earnings for every player.
- 🌐 **Farcaster Integration** — Built as a **Farcaster Mini App** so users can play directly inside Farcaster Frames.

---

## 🧠 How It Works

1. **Admin Creates Game**
   - Inputs a memecoin symbol (e.g., $DOGE).
   - Game runs for **20 minutes** total.

2. **Players Join**
   - Can join within the first **10 minutes** by guessing the final price.
   - Each player delegates a fixed bet amount (e.g., 0.01 ETH) to the contract via **MetaMask Smart Account Delegation**.

3. **Oracle Fetch**
   - After 20 minutes, the contract fetches the **real price** using **Chainlink Data Feeds**.

4. **Winner Selection**
   - The closest guess to the oracle price wins the pool.
   - All delegations are **redeemed** and distributed automatically.

---

## ⚙️ Tech Stack

- **Blockchain:** Monad Testnet
- **Wallet:** MetaMask Smart Account + Delegation Framework
- **Oracles:** Chainlink Price Feeds
- **Frontend:** Farcaster Mini App (Frame-based interaction)
- **Smart Contracts:** Solidity (deployed via Hardhat/Foundry)

---

## 🧩 Smart Contract Highlights

- Admin-only game creation
- Fixed bet amount per game
- Delegated fund locking using MetaMask’s Smart Account
- Oracle-based price resolution
- Leaderboard mapping tracking total wins and total rewards

---

## 💡 Progress During Hackathon

During the hackathon, we focused on integrating the **MetaMask Delegation Framework** into the game flow to enable trustless and smooth participation.
We initially faced issues with **undeployed Smart Accounts**, leading to failed delegated transactions and nonce mismatches.
Thanks to the **MetaMask team**, we learned how to properly initialize Smart Accounts before delegations and handle pre-deployment account abstractions effectively.

We also explored how **Farcaster Mini Apps** work — understanding Frame interactions and optimizing the onchain user flow.
By the end, we achieved a fully functional prediction mini app where users can join, bet, and win — all within **Farcaster**.

---
