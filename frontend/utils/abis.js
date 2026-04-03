// Minimal ABI — only the functions the frontend calls directly
// Full ABI is in backend/abi/GoldBond.json after deployment

export const GOLD_BOND_ABI = [
  "function whitelist(address) view returns (bool)",
  "function balanceOf(address, uint256) view returns (uint256)",
  "function getGoldPrice() view returns (int256)",
  "function getSilverPrice() view returns (int256)",
  "function calculateAccruedInterest(address, uint256) view returns (uint256)",
  "function setApprovalForAll(address, bool)",
  "function safeTransferFrom(address, address, uint256, uint256, bytes)",
  "event BondMinted(address indexed to, uint256 tokenId, uint256 amount, uint256 goldPriceUSD)",
];

export const MARKETPLACE_ABI = [
  "function listBond(uint256 tokenId, uint256 amount, uint256 pricePerUnit) returns (uint256)",
  "function buyBond(uint256 listingId) payable",
  "function cancelListing(uint256 listingId)",
  "function getAllActiveListings() view returns (tuple(address seller, uint256 tokenId, uint256 amount, uint256 pricePerUnit, bool active)[], uint256[])",
  "event Listed(uint256 indexed listingId, address indexed seller, uint256 tokenId, uint256 amount, uint256 pricePerUnit)",
  "event Sold(uint256 indexed listingId, address indexed buyer, uint256 tokenId, uint256 amount, uint256 totalPaid)",
];
