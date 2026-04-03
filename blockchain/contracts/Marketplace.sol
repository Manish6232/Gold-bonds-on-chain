// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * AuBlock - Marketplace Contract
 * Enables peer-to-peer trading of gold/silver bond tokens
 * Escrow model: seller locks tokens, buyer pays, contract releases atomically
 */
contract Marketplace is ERC1155Holder, Ownable {
    IERC1155 public bondContract;

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 amount;       // number of bond tokens
        uint256 pricePerUnit; // price in wei (MATIC) per token
        bool    active;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;

    // Platform fee: 0.5% (50 basis points)
    uint256 public constant FEE_BPS = 50;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit
    );
    event Sold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 tokenId,
        uint256 amount,
        uint256 totalPaid
    );
    event Cancelled(uint256 indexed listingId, address indexed seller);

    constructor(address _bondContract) Ownable(msg.sender) {
        bondContract = IERC1155(_bondContract);
    }

    // ─── LIST ─────────────────────────────────────────────────────────────────

    function listBond(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit
    ) external returns (uint256 listingId) {
        require(amount > 0, "Marketplace: amount must be > 0");
        require(pricePerUnit > 0, "Marketplace: price must be > 0");
        require(
            bondContract.balanceOf(msg.sender, tokenId) >= amount,
            "Marketplace: insufficient bond balance"
        );

        listingId = listingCount++;
        listings[listingId] = Listing({
            seller:       msg.sender,
            tokenId:      tokenId,
            amount:       amount,
            pricePerUnit: pricePerUnit,
            active:       true
        });

        // Lock tokens in this contract (escrow)
        bondContract.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        emit Listed(listingId, msg.sender, tokenId, amount, pricePerUnit);
    }

    // ─── BUY ──────────────────────────────────────────────────────────────────

    function buyBond(uint256 listingId) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Marketplace: listing not active");
        require(listing.seller != msg.sender, "Marketplace: cannot buy own listing");

        uint256 totalPrice = listing.pricePerUnit * listing.amount;
        require(msg.value >= totalPrice, "Marketplace: insufficient payment");

        // Calculate platform fee
        uint256 fee      = (totalPrice * FEE_BPS) / 10000;
        uint256 sellerAmt = totalPrice - fee;

        listing.active = false;

        // Release tokens to buyer
        bondContract.safeTransferFrom(address(this), msg.sender, listing.tokenId, listing.amount, "");

        // Pay seller
        payable(listing.seller).transfer(sellerAmt);

        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        emit Sold(listingId, msg.sender, listing.tokenId, listing.amount, totalPrice);
    }

    // ─── CANCEL ───────────────────────────────────────────────────────────────

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Marketplace: not your listing");
        require(listing.active, "Marketplace: listing not active");

        listing.active = false;

        // Return tokens to seller
        bondContract.safeTransferFrom(address(this), msg.sender, listing.tokenId, listing.amount, "");
        emit Cancelled(listingId, msg.sender);
    }

    // ─── VIEW ─────────────────────────────────────────────────────────────────

    function getActiveListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getAllActiveListings() external view returns (Listing[] memory, uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].active) count++;
        }

        Listing[] memory result = new Listing[](count);
        uint256[] memory ids    = new uint256[](count);
        uint256 idx = 0;

        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].active) {
                result[idx] = listings[i];
                ids[idx]    = i;
                idx++;
            }
        }
        return (result, ids);
    }

    // Owner can withdraw collected fees
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
