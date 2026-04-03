const express = require("express");
const router  = express.Router();
const { ethers } = require("ethers");
const { marketplaceContract } = require("../blockchain");
const { getPrices } = require("./goldPrice");

// GET /api/marketplace/listings — get all active P2P listings
router.get("/listings", async (req, res) => {
  try {
    const [listings, ids] = await marketplaceContract.getAllActiveListings();
    const prices = await getPrices();

    const formatted = listings.map((l, i) => {
      const pricePerUnitMATIC = parseFloat(ethers.formatEther(l.pricePerUnit));
      const totalMATIC        = pricePerUnitMATIC * Number(l.amount);

      return {
        listingId:      ids[i].toString(),
        seller:         l.seller,
        tokenId:        l.tokenId.toString(),
        tokenType:      l.tokenId.toString() === "1" ? "Gold Bond" : "Silver Bond",
        amount:         l.amount.toString(),
        grams:          (Number(l.amount) / 1000).toFixed(3),
        pricePerUnit:   ethers.formatEther(l.pricePerUnit),
        totalPriceMATIC: totalMATIC.toFixed(6),
        active:         l.active,
      };
    });

    res.json({ success: true, count: formatted.length, listings: formatted });
  } catch (err) {
    console.error("Listings error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/marketplace/list — list bonds for sale
// Note: The actual tx is sent FROM the frontend (user signs with their wallet)
// This endpoint just validates and returns the parameters
router.post("/list", async (req, res) => {
  const { tokenId, amount, pricePerUnitMATIC } = req.body;

  if (!tokenId || !amount || !pricePerUnitMATIC) {
    return res.status(400).json({ success: false, error: "tokenId, amount, pricePerUnitMATIC required" });
  }

  const priceWei = ethers.parseEther(pricePerUnitMATIC.toString());

  res.json({
    success: true,
    message: "Validated. Call Marketplace.listBond() from frontend with these params.",
    params: {
      tokenId:      parseInt(tokenId),
      amount:       parseInt(amount),
      pricePerUnit: priceWei.toString(),
    },
  });
});

// GET /api/marketplace/listing/:id — get single listing
router.get("/listing/:id", async (req, res) => {
  try {
    const listing = await marketplaceContract.getActiveListing(req.params.id);
    res.json({
      success: true,
      listing: {
        seller:    listing.seller,
        tokenId:   listing.tokenId.toString(),
        amount:    listing.amount.toString(),
        grams:     (Number(listing.amount) / 1000).toFixed(3),
        pricePerUnit: ethers.formatEther(listing.pricePerUnit),
        active:    listing.active,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
