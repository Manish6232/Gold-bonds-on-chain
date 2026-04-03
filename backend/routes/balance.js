const express = require("express");
const router  = express.Router();
const { bondContractReadOnly } = require("../blockchain");
const { getPrices } = require("./goldPrice");

/**
 * GET /api/balance/:address
 * Returns full portfolio: gold tokens, silver tokens, INR value, interest accrued
 */
router.get("/:address", async (req, res) => {
  const { address } = req.params;

  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ success: false, error: "Invalid wallet address" });
  }

  try {
    const [
      goldBalance,
      silverBalance,
      goldInterest,
      silverInterest,
      isWhitelisted,
      prices,
    ] = await Promise.all([
      bondContractReadOnly.balanceOf(address, 1),  // GOLD_BOND_ID = 1
      bondContractReadOnly.balanceOf(address, 2),  // SILVER_BOND_ID = 2
      bondContractReadOnly.calculateAccruedInterest(address, 1),
      bondContractReadOnly.calculateAccruedInterest(address, 2),
      bondContractReadOnly.whitelist(address),
      getPrices(),
    ]);

    const TOKENS_PER_GRAM = 1000;
    const goldGrams   = Number(goldBalance)   / TOKENS_PER_GRAM;
    const silverGrams = Number(silverBalance) / TOKENS_PER_GRAM;

    const goldValueINR   = goldGrams   * parseFloat(prices.gold.perGramINR);
    const silverValueINR = silverGrams * parseFloat(prices.silver.perGramINR);
    const totalValueINR  = goldValueINR + silverValueINR;

    const interestGoldGrams   = Number(goldInterest)   / TOKENS_PER_GRAM;
    const interestSilverGrams = Number(silverInterest) / TOKENS_PER_GRAM;

    res.json({
      success: true,
      address,
      isVerified: isWhitelisted,
      portfolio: {
        gold: {
          tokens:       goldBalance.toString(),
          grams:        goldGrams.toFixed(3),
          valueINR:     goldValueINR.toFixed(2),
          pricePerGram: prices.gold.perGramINR,
          interestEarned: {
            grams:  interestGoldGrams.toFixed(4),
            valueINR: (interestGoldGrams * parseFloat(prices.gold.perGramINR)).toFixed(2),
          },
        },
        silver: {
          tokens:       silverBalance.toString(),
          grams:        silverGrams.toFixed(3),
          valueINR:     silverValueINR.toFixed(2),
          pricePerGram: prices.silver.perGramINR,
          interestEarned: {
            grams:  interestSilverGrams.toFixed(4),
            valueINR: (interestSilverGrams * parseFloat(prices.silver.perGramINR)).toFixed(2),
          },
        },
        totalValueINR: totalValueINR.toFixed(2),
      },
    });
  } catch (err) {
    console.error("Balance error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
