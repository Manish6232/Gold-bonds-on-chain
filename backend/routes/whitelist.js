const express = require("express");
const router  = express.Router();
const { bondContract, bondContractReadOnly } = require("../blockchain");

/**
 * POST /api/whitelist/verify
 * Body: { walletAddress, name, aadhaarLast4, pan }
 * 
 * In production: would call DigiLocker/UIDAI API for real Aadhaar verification.
 * For hackathon: simulates KYC and whitelists the wallet.
 */
router.post("/verify", async (req, res) => {
  const { walletAddress, name, aadhaarLast4, pan } = req.body;

  if (!walletAddress || !name || !aadhaarLast4) {
    return res.status(400).json({ success: false, error: "walletAddress, name, aadhaarLast4 required" });
  }

  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ success: false, error: "Invalid wallet address" });
  }

  if (aadhaarLast4.length !== 4 || !/^\d+$/.test(aadhaarLast4)) {
    return res.status(400).json({ success: false, error: "Aadhaar last 4 digits must be exactly 4 numbers" });
  }

  try {
    // Check if already whitelisted
    const alreadyVerified = await bondContractReadOnly.whitelist(walletAddress);
    if (alreadyVerified) {
      return res.json({ success: true, message: "Wallet already KYC verified", alreadyVerified: true });
    }

    // === PRODUCTION: Replace this block with real DigiLocker/UIDAI API call ===
    // const kycResult = await digiLockerAPI.verify({ aadhaar: aadhaarLast4, pan, name });
    // if (!kycResult.verified) throw new Error("KYC verification failed");
    // ==========================================================================

    // Simulate a 1-second verification delay (makes it feel real in demo)
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`KYC approved: ${name} | Aadhaar: ****${aadhaarLast4} | Wallet: ${walletAddress}`);

    // Whitelist on-chain (admin relay)
    const tx = await bondContract.addToWhitelist(walletAddress, { gasLimit: 100000 });
    await tx.wait();

    res.json({
      success:    true,
      message:    "KYC verification successful. Wallet whitelisted.",
      txHash:     tx.hash,
      walletAddress,
      verifiedAt: new Date().toISOString(),
      explorerUrl: `https://mumbai.polygonscan.com/tx/${tx.hash}`,
    });

  } catch (err) {
    console.error("Whitelist error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/whitelist/status/:address
 * Check if a wallet is KYC verified
 */
router.get("/status/:address", async (req, res) => {
  const { address } = req.params;

  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ success: false, error: "Invalid wallet address" });
  }

  try {
    const isVerified = await bondContractReadOnly.whitelist(address);
    res.json({ success: true, address, isVerified });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
