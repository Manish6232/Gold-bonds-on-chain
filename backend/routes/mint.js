const express = require("express");
const router  = express.Router();
const { bondContract } = require("../blockchain");

/**
 * POST /api/mint
 * Body: { walletAddress, tokenId, amountInRupees }
 * 
 * Converts INR amount to token units and mints to the user's wallet.
 * Admin wallet pays the gas (gasless for user).
 * 
 * Token math:
 *   1 token = 0.001 gram of gold
 *   amountInRupees / pricePerGramINR * TOKENS_PER_GRAM = token count
 */
router.post("/", async (req, res) => {
  const { walletAddress, tokenId = 1, amountInRupees } = req.body;

  if (!walletAddress || !amountInRupees) {
    return res.status(400).json({ success: false, error: "walletAddress and amountInRupees required" });
  }

  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ success: false, error: "Invalid wallet address" });
  }

  if (amountInRupees < 10) {
    return res.status(400).json({ success: false, error: "Minimum investment is ₹10" });
  }

  try {
    // Check if wallet is whitelisted
    const isWhitelisted = await bondContract.whitelist(walletAddress);
    if (!isWhitelisted) {
      return res.status(403).json({ success: false, error: "Wallet not KYC verified. Complete verification first." });
    }

    // Get current gold price to calculate tokens
    const { getPrices } = require("./goldPrice");
    const prices      = await getPrices();
    const pricePerGramINR = parseFloat(
      tokenId === 1 ? prices.gold.perGramINR : prices.silver.perGramINR
    );

    // Calculate tokens: ₹100 at ₹6000/gram → 100/6000 * 1000 = 16.67 → 16 tokens
    const TOKENS_PER_GRAM  = 1000;
    const tokenAmount = Math.floor((amountInRupees / pricePerGramINR) * TOKENS_PER_GRAM);

    if (tokenAmount < 1) {
      return res.status(400).json({ success: false, error: "Amount too small to purchase even 1 token unit" });
    }

    console.log(`Minting ${tokenAmount} tokens (token ID ${tokenId}) to ${walletAddress}`);

    // Send transaction — admin wallet pays gas (relay service)
    const tx = await bondContract.mint(walletAddress, tokenId, tokenAmount, {
      gasLimit: 200000,
    });

    console.log("Tx sent:", tx.hash);
    await tx.wait(); // wait for 1 block confirmation
    console.log("Tx confirmed:", tx.hash);

    res.json({
      success:     true,
      txHash:      tx.hash,
      tokensIssued: tokenAmount,
      gramsEquivalent: (tokenAmount / TOKENS_PER_GRAM).toFixed(3),
      amountINR:   amountInRupees,
      explorerUrl: `https://mumbai.polygonscan.com/tx/${tx.hash}`,
    });

  } catch (err) {
    console.error("Mint error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
