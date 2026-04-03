require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const http    = require("http");
const { Server } = require("socket.io");

const goldPriceRoute   = require("./routes/goldPrice");
const mintRoute        = require("./routes/mint");
const whitelistRoute   = require("./routes/whitelist");
const balanceRoute     = require("./routes/balance");
const marketplaceRoute = require("./routes/marketplace");
const ipfsRoute        = require("./routes/ipfs");
const interestRoute    = require("./routes/interest");

const { startPriceBroadcast } = require("./services/priceBroadcast");

const app    = express();
const server = http.createServer(app);

// WebSocket server for live gold price push
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "AuBlock API running", version: "1.0.0" });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/gold-price",   goldPriceRoute);
app.use("/api/mint",         mintRoute);
app.use("/api/whitelist",    whitelistRoute);
app.use("/api/balance",      balanceRoute);
app.use("/api/marketplace",  marketplaceRoute);
app.use("/api/ipfs",         ipfsRoute);
app.use("/api/interest",     interestRoute);

// ─── WebSocket: push live gold price every 30s ────────────────────────────────
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

startPriceBroadcast(io); // starts interval broadcast

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 AuBlock API running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket live price feed active`);
});
