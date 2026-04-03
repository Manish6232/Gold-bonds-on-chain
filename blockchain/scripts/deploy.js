const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

// Chainlink price feed addresses on Polygon Mumbai testnet
const GOLD_FEED   = "0x0715A7794a1dc8e42615F059dD6e406A6594651A";
const SILVER_FEED = "0x379CE235e4ca74BeE23E79c0Fc1Cf2bDDaFAd61";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // 1. Deploy GoldBond
  console.log("\n--- Deploying GoldBond ---");
  const GoldBond = await hre.ethers.getContractFactory("GoldBond");
  const goldBond = await GoldBond.deploy(GOLD_FEED, SILVER_FEED);
  await goldBond.waitForDeployment();
  const goldBondAddress = await goldBond.getAddress();
  console.log("GoldBond deployed to:", goldBondAddress);

  // 2. Deploy Marketplace
  console.log("\n--- Deploying Marketplace ---");
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(goldBondAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace deployed to:", marketplaceAddress);

  // 3. Save addresses and ABIs for the backend
  const addresses = {
    GoldBond:    goldBondAddress,
    Marketplace: marketplaceAddress,
    network:     hre.network.name,
    deployedAt:  new Date().toISOString()
  };

  // Write addresses
  fs.writeFileSync(
    path.join(__dirname, "../deployed-addresses.json"),
    JSON.stringify(addresses, null, 2)
  );

  // Copy ABIs to backend folder
  const backendAbiDir = path.join(__dirname, "../../backend/abi");
  if (!fs.existsSync(backendAbiDir)) fs.mkdirSync(backendAbiDir, { recursive: true });

  const goldBondArtifact   = await hre.artifacts.readArtifact("GoldBond");
  const marketplaceArtifact = await hre.artifacts.readArtifact("Marketplace");

  fs.writeFileSync(
    path.join(backendAbiDir, "GoldBond.json"),
    JSON.stringify(goldBondArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(backendAbiDir, "Marketplace.json"),
    JSON.stringify(marketplaceArtifact.abi, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("📄 Addresses saved to deployed-addresses.json");
  console.log("📄 ABIs saved to backend/abi/");
  console.log("\nAdd these to backend/.env:");
  console.log(`BOND_CONTRACT_ADDRESS=${goldBondAddress}`);
  console.log(`MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
