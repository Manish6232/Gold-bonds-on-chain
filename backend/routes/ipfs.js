const express = require("express");
const router  = require("express").Router();
const multer  = require("multer");

// Use memory storage (don't save to disk)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * POST /api/ipfs/upload
 * Uploads a bond certificate PDF to IPFS via nft.storage
 * Returns the IPFS CID to store on-chain
 */
router.post("/upload", upload.single("document"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded. Use field name 'document'." });
  }

  const { bondId, bondType = "gold" } = req.body;

  try {
    let cid;

    if (!process.env.NFT_STORAGE_KEY || process.env.NFT_STORAGE_KEY === "your_nft_storage_key") {
      // DEMO MODE: return a fake CID so the rest of the app still works
      cid = `bafybeihSIMULATED${Date.now()}aublock${bondId || "0"}`;
      console.log("IPFS demo mode — using simulated CID:", cid);
    } else {
      // REAL MODE: upload to nft.storage
      const { NFTStorage, File } = require("nft.storage");
      const client = new NFTStorage({ token: process.env.NFT_STORAGE_KEY });
      cid = await client.storeBlob(
        new File([req.file.buffer], `aublock-bond-${bondId || Date.now()}.pdf`, {
          type: "application/pdf",
        })
      );
    }

    const ipfsUrl = `ipfs://${cid}`;
    const gatewayUrl = `https://nftstorage.link/ipfs/${cid}`;

    console.log(`Bond document uploaded: ${ipfsUrl}`);

    res.json({
      success:    true,
      cid,
      ipfsUrl,
      gatewayUrl, // browser-viewable link
      bondId,
      bondType,
      uploadedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("IPFS upload error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ipfs/document/:tokenId
 * Get the IPFS document URL for a bond token
 */
router.get("/document/:tokenId", async (req, res) => {
  try {
    const { bondContractReadOnly } = require("../blockchain");
    const cid = await bondContractReadOnly.bondDocumentCID(req.params.tokenId);

    if (!cid) {
      return res.json({ success: true, cid: null, message: "No document uploaded for this bond" });
    }

    res.json({
      success:    true,
      tokenId:    req.params.tokenId,
      cid,
      ipfsUrl:    `ipfs://${cid}`,
      gatewayUrl: `https://nftstorage.link/ipfs/${cid}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
