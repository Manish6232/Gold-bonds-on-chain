<<<<<<< HEAD
# Gold-bonds-on-chain
=======
# AuBlock — Tokenized Sovereign Gold & Silver Bonds

> India's first programmable gold bond — liquid, fractional, trustless.

---

## What it does

AuBlock tokenizes India's Sovereign Gold Bond (SGB) on blockchain:
- **Buy** gold/silver bonds from ₹10 (fractional ownership)
- **Trade** peer-to-peer on the marketplace — no broker, instant settlement
- **Earn** 2.5% interest automatically calculated on-chain
- **Verify** bond value via live Chainlink XAU/USD oracle
- **KYC** via Aadhaar simulation — wallet whitelisted on-chain

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Smart contracts | Solidity + Hardhat + OpenZeppelin |
| Blockchain | Polygon Mumbai testnet |
| Oracle | Chainlink XAU/USD + XAG/USD |
| Backend API | Node.js + Express + Socket.io |
| Frontend | Next.js + Tailwind CSS |
| Wallet | wagmi v2 + RainbowKit |
| Storage | IPFS via nft.storage |

---

## Project Structure

```
aublock/
├── blockchain/    ← Smart contracts (P1 + P2)
├── backend/       ← API server (P2)
└── frontend/      ← UI (P3 + P4)
```

---

## Setup — Step by Step

### Prerequisites

Install these before starting:
- Node.js v18+ → https://nodejs.org
- MetaMask browser extension → https://metamask.io
- Git → https://git-scm.com

---

### Step 1 — Get API keys (everyone needs these)

1. **Alchemy** (free) → https://alchemy.com
   - Create account → New App → Chain: Polygon → Network: Mumbai
   - Copy the HTTPS URL

2. **MetaMask wallet**
   - Install extension → Create wallet → Save seed phrase
   - Switch network to "Polygon Mumbai" (add from chainlist.org)
   - Export private key: Account → three dots → Account Details → Export Private Key

3. **Get free test MATIC**
   - Go to https://mumbaifaucet.com
   - Paste your MetaMask address → Get MATIC

4. **WalletConnect** (free) → https://cloud.walletconnect.com
   - Create project → Copy Project ID

5. **nft.storage** (free) → https://nft.storage
   - Create account → API Keys → New Key

---

### Step 2 — Deploy smart contracts (P1 does this)

```bash
cd blockchain
npm install
cp .env.example .env
```

Fill in `blockchain/.env`:
```
ALCHEMY_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_metamask_private_key
```

Run tests first:
```bash
npx hardhat test
# Should see: 10 passing
```

Deploy to Mumbai:
```bash
npx hardhat run scripts/deploy.js --network mumbai
```

Output will look like:
```
GoldBond deployed to:    0xABC...
Marketplace deployed to: 0xDEF...

Add these to backend/.env:
BOND_CONTRACT_ADDRESS=0xABC...
MARKETPLACE_CONTRACT_ADDRESS=0xDEF...
```

**Share these two addresses with the whole team in the group chat.**

---

### Step 3 — Start the backend (P2 does this)

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `backend/.env`:
```
ALCHEMY_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_metamask_private_key
BOND_CONTRACT_ADDRESS=0x...        ← from Step 2
MARKETPLACE_CONTRACT_ADDRESS=0x... ← from Step 2
NFT_STORAGE_KEY=your_nft_storage_key
PORT=3001
```

Start the server:
```bash
node server.js
```

You should see:
```
🚀 AuBlock API running on http://localhost:3001
📡 WebSocket live price feed active
```

Test it immediately:
```bash
curl http://localhost:3001/api/gold-price
# Should return JSON with gold price in USD and INR
```

**Share `http://localhost:3001` with P3 and P4 as the API base URL.**

---

### Step 4 — Start the frontend (P3 + P4 do this)

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Fill in `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BOND_ADDRESS=0x...        ← from Step 2
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x... ← from Step 2
NEXT_PUBLIC_WALLETCONNECT_ID=your_walletconnect_project_id
```

Start development server:
```bash
npm run dev
# Opens on http://localhost:3000
```

---

## All API Endpoints (P2's backend)

| Method | Endpoint | What it does |
|--------|----------|-------------|
| GET | `/api/gold-price` | Live gold + silver price in USD and INR |
| GET | `/api/balance/:address` | Full portfolio with INR value |
| GET | `/api/interest/:address` | Accrued interest for a wallet |
| GET | `/api/whitelist/status/:address` | Check if wallet is KYC verified |
| POST | `/api/whitelist/verify` | Verify KYC + whitelist wallet |
| POST | `/api/mint` | Mint bond tokens (gasless relay) |
| GET | `/api/marketplace/listings` | All active P2P listings |
| GET | `/api/marketplace/listing/:id` | Single listing |
| POST | `/api/ipfs/upload` | Upload bond document to IPFS |
| GET | `/api/ipfs/document/:tokenId` | Get IPFS CID for a bond |

---

## All Frontend Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Portfolio view, live prices, holdings |
| Buy bonds | `/buy` | Buy gold/silver bonds with INR |
| Marketplace | `/marketplace` | P2P trade — buy & sell listings |
| KYC | `/kyc` | Aadhaar verification flow |

---

## Demo Script for Judges

1. Open `http://localhost:3000`
2. Click **Connect Wallet** → Select MetaMask → Approve
3. Go to **Verify KYC** → Enter name + Aadhaar last 4 → Submit
   - Show: wallet gets whitelisted on-chain (Polygonscan link appears)
4. Go to **Buy Bonds** → Enter ₹500 → Select Gold Bond → Buy
   - Show: gasless transaction (user pays ₹0 gas)
   - Show: tokens appear in portfolio immediately
5. Go to **Dashboard** → Show live gold price updating from Chainlink
6. Go to **Marketplace** → List 100 units for sale → Switch to second wallet → Buy it
   - Show: peer-to-peer trade with no broker, settled in one transaction

**Key talking points:**
- Chainlink oracle = tamper-proof gold price, no one can fake it
- Gasless = any Indian user can invest without needing crypto first
- Fractional = invest from ₹10, not ₹6000 minimum
- IPFS = bond certificate permanently stored, nobody can delete it

---

## Team

| Person | Role |
|--------|------|
| P1 | Smart contract dev (Solidity + Hardhat) |
| P2 | Blockchain + oracle + backend API |
| P3 | Frontend — dashboard + buy page |
| P4 | Frontend — marketplace + KYC + pitch |
>>>>>>> 978f5a4 (Initial commit)
