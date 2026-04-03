const express = require("express");
const router  = express.Router();
const { bondContractReadOnly } = require("../blockchain");
const { getPrices } = require("./goldPrice");

// GET /api/interest/:address
router.get("/:address", async (req, res) => {
  const { address } = req.params;

  try {
    const [goldInterest, silverInterest, prices] = await Promise.all([
      bondContractReadOnly.calculateAccruedInterest(address, 1),
      bondContractReadOnly.calculateAccruedInterest(address, 2),
      getPrices(),
    ]);

    const TOKENS_PER_GRAM = 1000;
    const goldGrams   = Number(goldInterest)   / TOKENS_PER_GRAM;
    const silverGrams = Number(silverInterest) / TOKENS_PER_GRAM;

    res.json({
      success: true,
      address,
      interest: {
        gold: {
          tokens:   goldInterest.toString(),
          grams:    goldGrams.toFixed(6),
          valueINR: (goldGrams * parseFloat(prices.gold.perGramINR)).toFixed(2),
        },
        silver: {
          tokens:   silverInterest.toString(),
          grams:    silverGrams.toFixed(6),
          valueINR: (silverGrams * parseFloat(prices.silver.perGramINR)).toFixed(2),
        },
        annualRatePct: "2.5",
        note: "Interest compounds annually per RBI SGB rules",
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
