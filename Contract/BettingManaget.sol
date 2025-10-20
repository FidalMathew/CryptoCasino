// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MemecoinGuessGame is Ownable {
    uint256 public constant JOIN_DURATION = 10 minutes;
    uint256 public constant TOTAL_DURATION = 11 minutes;

    uint256 public nextGameId;
    address public delegateAccount; // fallback if winner doesn't claim

    struct PlayerBet {
        uint256 guessPrice;
        bool joined;
        bool claimed;
    }

    struct Game {
        uint256 id;
        string symbol;
        AggregatorV3Interface priceFeed;
        uint256 startAt;
        uint256 joinEndsAt;
        uint256 endsAt;
        uint256 fixedBetAmount;
        uint256 totalPool;
        address[] players;
        mapping(address => PlayerBet) bets;
        bool active;
        bool resolved;
        uint256 finalPrice;
        address winner;
    }

    mapping(uint256 => Game) public games;
    mapping(address => uint256) public totalWins;
    mapping(address => uint256) public totalEarnings;

    mapping(string => address) public priceFeeds; // symbol → feed mapping
    address[] public allPlayers;
    mapping(address => bool) public isKnownPlayer;

    event GameCreated(uint256 indexed gameId, string symbol, uint256 fixedBetAmount, uint256 startAt);
    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 guessPrice);
    event GuessUpdated(uint256 indexed gameId, address indexed player, uint256 newGuess);
    event GameResolved(uint256 indexed gameId, address winner, uint256 finalPrice, uint256 totalPool);
    event WinningsClaimed(uint256 indexed gameId, address indexed player, uint256 amount);

    constructor(address _delegate) Ownable(msg.sender) {
        require(_delegate != address(0), "Invalid delegate");
        delegateAccount = _delegate;

        // default feeds
        priceFeeds["BTC"] = 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43;
        priceFeeds["ETH"] = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
       
    }

    modifier gameExists(uint256 gameId) {
        require(gameId < nextGameId, "Game does not exist");
        _;
    }

    // ────────────────────────────────────────────────────────────────
    // 🧩 ADMIN: Manage Price Feeds
    // ────────────────────────────────────────────────────────────────
    function addPriceFeed(string calldata symbol, address feed) external onlyOwner {
        priceFeeds[symbol] = feed;
    }

    function removePriceFeed(string calldata symbol) external onlyOwner {
        delete priceFeeds[symbol];
    }

    // ────────────────────────────────────────────────────────────────
    // 🕹️ ADMIN: Create Game
    // ────────────────────────────────────────────────────────────────
    function createGame(string calldata symbol, uint256 fixedBetAmount) external onlyOwner returns (uint256) {
        address feedAddr = priceFeeds[symbol];
        require(feedAddr != address(0), "Feed not found");

        uint256 gid = nextGameId++;
        Game storage g = games[gid];
        g.id = gid;
        g.symbol = symbol;
        g.priceFeed = AggregatorV3Interface(feedAddr);
        g.startAt = block.timestamp;
        g.joinEndsAt = block.timestamp + JOIN_DURATION;
        g.endsAt = block.timestamp + TOTAL_DURATION;
        g.fixedBetAmount = fixedBetAmount;
        g.active = true;

        emit GameCreated(gid, symbol, fixedBetAmount, g.startAt);
        return gid;
    }

    // ────────────────────────────────────────────────────────────────
    // 🎮 USER: Join Game
    // ────────────────────────────────────────────────────────────────
    function joinGame(uint256 gameId, uint256 guessPrice) external gameExists(gameId) {
        Game storage g = games[gameId];
        require(g.active, "Game inactive");
        require(block.timestamp <= g.joinEndsAt, "Join phase over");
        require(!g.bets[msg.sender].joined, "Already joined");

        if (!isKnownPlayer[msg.sender]) {
            isKnownPlayer[msg.sender] = true;
            allPlayers.push(msg.sender);
        }

        g.players.push(msg.sender);
        g.bets[msg.sender] = PlayerBet(guessPrice, true, false);
        g.totalPool += g.fixedBetAmount;

        emit PlayerJoined(gameId, msg.sender, guessPrice);
    }

    // ────────────────────────────────────────────────────────────────
    // 🔄 USER: Update Guess
    // ────────────────────────────────────────────────────────────────
    function updateGuess(uint256 gameId, uint256 newGuess) external gameExists(gameId) {
        Game storage g = games[gameId];
        require(g.active, "Game inactive");
        require(block.timestamp <= g.joinEndsAt, "Join phase over");
        require(g.bets[msg.sender].joined, "Not joined");

        g.bets[msg.sender].guessPrice = newGuess;
        emit GuessUpdated(gameId, msg.sender, newGuess);
    }

    // ────────────────────────────────────────────────────────────────
    // 🧠 ADMIN: Resolve Game
    // ────────────────────────────────────────────────────────────────
    function resolveGame(uint256 gameId) external onlyOwner gameExists(gameId) {
        Game storage g = games[gameId];
        require(block.timestamp >= g.endsAt, "Game not ended yet");
        require(!g.resolved, "Already resolved");
        require(g.players.length > 0, "No players");

        uint256 finalPrice = _getFinalPrice(g);
        address winner = _findWinner(g, finalPrice);

        g.finalPrice = finalPrice;
        g.winner = winner;
        g.resolved = true;
        g.active = false;

        totalWins[winner] += 1;
        totalEarnings[winner] += g.totalPool;

        emit GameResolved(gameId, winner, finalPrice, g.totalPool);
    }

    // ────────────────────────────────────────────────────────────────
    // 💰 USER: Claim Winnings
    // ────────────────────────────────────────────────────────────────
    function claimWinnings(uint256 gameId) external gameExists(gameId) {
        Game storage g = games[gameId];
        require(g.resolved, "Game not resolved");
        require(msg.sender == g.winner, "Not the winner");
        require(!g.bets[msg.sender].claimed, "Already claimed");

        g.bets[msg.sender].claimed = true;
        payable(msg.sender).transfer(g.totalPool); // Using native ETH for simplicity
        emit WinningsClaimed(gameId, msg.sender, g.totalPool);
    }

    // ────────────────────────────────────────────────────────────────
    // Internal helpers
    // ────────────────────────────────────────────────────────────────
    function _getFinalPrice(Game storage g) internal view returns (uint256) {
        (, int256 answer,,,) = g.priceFeed.latestRoundData();
        require(answer > 0, "Invalid oracle price");
        return uint256(answer);
    }

    function _findWinner(Game storage g, uint256 finalPrice) internal view returns (address) {
        address best;
        uint256 bestDiff = type(uint256).max;

        for (uint256 i = 0; i < g.players.length; i++) {
            address p = g.players[i];
            uint256 guess = g.bets[p].guessPrice;
            uint256 diff = guess > finalPrice ? guess - finalPrice : finalPrice - guess;

            if (diff < bestDiff) {
                best = p;
                bestDiff = diff;
            }
        }
        return best;
    }

    // ────────────────────────────────────────────────────────────────
    // 🏆 LEADERBOARD
    // ────────────────────────────────────────────────────────────────
    function getLeaderboard(address player) external view returns (uint256 wins, uint256 earnings) {
        return (totalWins[player], totalEarnings[player]);
    }

    function getFullLeaderboard() external view returns (address[] memory, uint256[] memory, uint256[] memory) {
        uint256 len = allPlayers.length;
        uint256[] memory wins = new uint256[](len);
        uint256[] memory earnings = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            wins[i] = totalWins[allPlayers[i]];
            earnings[i] = totalEarnings[allPlayers[i]];
        }
        return (allPlayers, wins, earnings);
    }

    // ────────────────────────────────────────────────────────────────
    // 🔍 VIEW PLAYERS OF GAME
    // ────────────────────────────────────────────────────────────────
    function getPlayers(uint256 gameId) external view returns (address[] memory) {
        return games[gameId].players;
    }

    function getPlayerGuess(uint256 gameId, address player) external view returns (uint256 guess, bool joined, bool claimed) {
        PlayerBet storage b = games[gameId].bets[player];
        return (b.guessPrice, b.joined, b.claimed);
    }

    function getGameState(uint256 gameId)
        external
        view
        returns (
            string memory symbol,
            uint256 startAt,
            uint256 joinEndsAt,
            uint256 endsAt,
            bool active,
            bool resolved,
            uint256 fixedBetAmount,
            uint256 totalPool,
            address winner,
            uint256 finalPrice
        )
    {
        Game storage g = games[gameId];
        return (
            g.symbol,
            g.startAt,
            g.joinEndsAt,
            g.endsAt,
            g.active,
            g.resolved,
            g.fixedBetAmount,
            g.totalPool,
            g.winner,
            g.finalPrice
        );
    }


    // Receive ETH deposits
    receive() external payable {}
}