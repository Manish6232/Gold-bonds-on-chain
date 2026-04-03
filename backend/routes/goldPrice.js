const express = require("express");
const router  = express.Router();
const { bondContractReadOnly } = require("../blockchain");

// Cache price for 30s to avoid hammering the node
let priceCache = { gold: null, silver: null, inrRate: null, updatedAt: 0 };
const CACHE_TTL = 30 * 1000; // 30 seconds

async function fetchINRRate() {
  try {
    const res  = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    return data.rates?.INR || 83.5; // fallback if API down
  } catch {
    return 83.5; // hardcoded fallback
  }
}

async function getPrices() {
  const now = Date.now();
  if (now - priceCache.updatedAt < CACHE_TTL && priceCache.gold) {
    return priceCache;
  }

  const [rawGold, rawSilver, inrRate] = await Promise.all([
    bondContractReadOnly.getGoldPrice(),
    bondContractReadOnly.getSilverPrice(),
    fetchINRRate(),
  ]);

  // Chainlink returns price * 10^8
  const goldUSD   = Number(rawGold)   / 1e8;
  const silverUSD = Number(rawSilver) / 1e8;

  // Per gram (troy oz = 31.1g)
  const goldPerGramUSD   = goldUSD   / 31.1035;
  const silverPerGramUSD = silverUSD / 31.1035;

  priceCache = {
    gold: {
      usd:         goldUSD.toFixed(2),
      inr:         (goldUSD * inrRate).toFixed(2),
      perGramUSD:  goldPerGramUSD.toFixed(2),
      perGramINR:  (goldPerGramUSD * inrRate).toFixed(2),
      raw:         rawGold.toString(),
    },
    silver: {
      usd:         silverUSD.toFixed(2),
      inr:         (silverUSD * inrRate).toFixed(2),
      perGramUSD:  silverPerGramUSD.toFixed(2),
      perGramINR:  (silverPerGramUSD * inrRate).toFixed(2),
      raw:         rawSilver.toString(),
    },
    inrRate: inrRate.toFixed(2),
    updatedAt: now,
  };

  return priceCache;
}

// GET /api/gold-price
router.get("/", async (req, res) => {
  try {
    const prices = await getPrices();
    res.json({ success: true, data: prices });
  } catch (err) {
    console.error("Price fetch error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch price" });
  }
});

// Export for WebSocket broadcast
module.exports = router;
module.exports.getPrices = getPrices;
