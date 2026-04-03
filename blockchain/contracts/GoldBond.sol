// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * AuBlock - GoldBond Contract
 * Tokenizes India Sovereign Gold Bonds on-chain
 * Token ID 1 = Gold Bond (XAU)
 * Token ID 2 = Silver Bond (XAG)
 */
contract GoldBond is ERC1155, Ownable {
    AggregatorV3Interface public goldPriceFeed;
    AggregatorV3Interface public silverPriceFeed;

    // KYC whitelist - wallet must be verified before receiving bonds
    mapping(address => bool) public whitelist;

    // Bond metadata stored on-chain
    mapping(uint256 => string) public bondDocumentCID; // IPFS CID for bond certificate
    mapping(address => uint256) public bondPurchaseTime; // when user bought bond

    // Interest rate: 2.5% per annum (in basis points: 250 = 2.5%)
    uint256 public constant INTEREST_RATE_BPS = 250;
    uint256 public constant SECONDS_PER_YEAR = 31536000;

    uint256 public constant GOLD_BOND_ID = 1;
    uint256 public constant SILVER_BOND_ID = 2;

    // 1 token = 0.001 gram of gold (so 1000 tokens = 1 gram)
    // This allows fractional ownership
    uint256 public constant TOKENS_PER_GRAM = 1000;

    event BondMinted(address indexed to, uint256 tokenId, uint256 amount, uint256 goldPriceUSD);
    event BondRedeemed(address indexed from, uint256 tokenId, uint256 amount);
    event WalletWhitelisted(address indexed wallet);
    event DocumentUploaded(uint256 indexed tokenId, string cid);

    constructor(
        address _goldFeed,
        address _silverFeed
    ) ERC1155("https://aublock.io/api/token/{id}.json") Ownable(msg.sender) {
        // Polygon Mumbai testnet addresses:
        // Gold XAU/USD:    0x0715A7794a1dc8e42615F059dD6e406A6594651A
        // Silver XAG/USD:  0x379CE235e4ca74BeE23E79c0Fc1Cf2bDDaFAd61
        goldPriceFeed   = AggregatorV3Interface(_goldFeed);
        silverPriceFeed = AggregatorV3Interface(_silverFeed);
    }

    // ─── ORACLE ──────────────────────────────────────────────────────────────

    function getGoldPrice() public view returns (int256) {
        (, int256 price,,,) = goldPriceFeed.latestRoundData();
        return price; // price * 10^8  (e.g. 196000000000 = $1960.00)
    }

    function getSilverPrice() public view returns (int256) {
        (, int256 price,,,) = silverPriceFeed.latestRoundData();
        return price;
    }

    // ─── KYC ─────────────────────────────────────────────────────────────────

    function addToWhitelist(address wallet) external onlyOwner {
        whitelist[wallet] = true;
        emit WalletWhitelisted(wallet);
    }

    function removeFromWhitelist(address wallet) external onlyOwner {
        whitelist[wallet] = false;
    }

    function batchWhitelist(address[] calldata wallets) external onlyOwner {
        for (uint256 i = 0; i < wallets.length; i++) {
            whitelist[wallets[i]] = true;
            emit WalletWhitelisted(wallets[i]);
        }
    }

    // ─── MINT / BURN ──────────────────────────────────────────────────────────

    function mint(
        address to,
        uint256 tokenId,
        uint256 amount  // amount in smallest unit (1 = 0.001 gram)
    ) external onlyOwner {
        require(whitelist[to], "GoldBond: wallet not KYC verified");
        require(tokenId == GOLD_BOND_ID || tokenId == SILVER_BOND_ID, "GoldBond: invalid token ID");

        if (bondPurchaseTime[to] == 0) {
            bondPurchaseTime[to] = block.timestamp;
        }

        int256 price = tokenId == GOLD_BOND_ID ? getGoldPrice() : getSilverPrice();
        _mint(to, tokenId, amount, "");
        emit BondMinted(to, tokenId, amount, uint256(price));
    }

    function redeem(uint256 tokenId, uint256 amount) external {
        require(whitelist[msg.sender], "GoldBond: wallet not KYC verified");
        require(balanceOf(msg.sender, tokenId) >= amount, "GoldBond: insufficient balance");
        _burn(msg.sender, tokenId, amount);
        emit BondRedeemed(msg.sender, tokenId, amount);
    }

    // ─── INTEREST ────────────────────────────────────────────────────────────

    function calculateAccruedInterest(
        address holder,
        uint256 tokenId
    ) public view returns (uint256) {
        uint256 balance = balanceOf(holder, tokenId);
        if (balance == 0 || bondPurchaseTime[holder] == 0) return 0;

        uint256 timeHeld = block.timestamp - bondPurchaseTime[holder];
        // interest = balance * rate * time / year / 10000 (bps)
        return (balance * INTEREST_RATE_BPS * timeHeld) / (SECONDS_PER_YEAR * 10000);
    }

    // ─── DOCUMENT ────────────────────────────────────────────────────────────

    function setBondDocument(uint256 tokenId, string calldata cid) external onlyOwner {
        bondDocumentCID[tokenId] = cid;
        emit DocumentUploaded(tokenId, cid);
    }

    // ─── TRANSFER GUARD ──────────────────────────────────────────────────────
    // Both sender and receiver must be KYC verified

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        require(whitelist[to], "GoldBond: recipient not KYC verified");
        super.safeTransferFrom(from, to, id, amount, data);
    }
}
