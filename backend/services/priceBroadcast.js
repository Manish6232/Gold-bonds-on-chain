const { getPrices } = require("../routes/goldPrice");

/**
 * Broadcasts live gold/silver prices to all connected WebSocket clients
 * every 30 seconds. Frontend connects once and gets real-time updates.
 */
function startPriceBroadcast(io) {
  const broadcast = async () => {
    try {
      const prices = await getPrices();
      io.emit("price-update", {
        timestamp: new Date().toISOString(),
        gold:   prices.gold,
        silver: prices.silver,
        inrRate: prices.inrRate,
      });
    } catch (err) {
      console.error("Price broadcast error:", err.message);
    }
  };

  // Broadcast immediately on start, then every 30 seconds
  broadcast();
  setInterval(broadcast, 30 * 1000);

  console.log("📡 Price broadcast service started (every 30s)");
}

module.exports = { startPriceBroadcast };
