const { ethers } = require("ethers");
const GoldBondABI    = require("../abi/GoldBond.json");
const MarketplaceABI = require("../abi/Marketplace.json");

if (!process.env.ALCHEMY_URL)      throw new Error("Missing ALCHEMY_URL in .env");
if (!process.env.PRIVATE_KEY)      throw new Error("Missing PRIVATE_KEY in .env");
if (!process.env.BOND_CONTRACT_ADDRESS)        throw new Error("Missing BOND_CONTRACT_ADDRESS in .env");
if (!process.env.MARKETPLACE_CONTRACT_ADDRESS) throw new Error("Missing MARKETPLACE_CONTRACT_ADDRESS in .env");

// Read-only provider (for fetching data)
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);

// Admin wallet (for signing transactions — relay service)
const adminWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract instances (read-only)
const bondContractReadOnly = new ethers.Contract(
  process.env.BOND_CONTRACT_ADDRESS,
  GoldBondABI,
  provider
);

// Contract instances (write — admin signed)
const bondContract = new ethers.Contract(
  process.env.BOND_CONTRACT_ADDRESS,
  GoldBondABI,
  adminWallet
);

const marketplaceContract = new ethers.Contract(
  process.env.MARKETPLACE_CONTRACT_ADDRESS,
  MarketplaceABI,
  adminWallet
);

module.exports = {
  provider,
  adminWallet,
  bondContract,
  bondContractReadOnly,
  marketplaceContract,
};
