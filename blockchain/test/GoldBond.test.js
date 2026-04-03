const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("GoldBond", function () {
  let goldBond, owner, user1, user2;

  // Mock Chainlink aggregator for testing
  let mockFeed;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy a mock price feed
    const MockFeed = await ethers.getContractFactory("MockAggregator");
    mockFeed = await MockFeed.deploy(196000000000n); // $1960.00 gold price

    const GoldBond = await ethers.getContractFactory("GoldBond");
    goldBond = await GoldBond.deploy(
      await mockFeed.getAddress(),
      await mockFeed.getAddress()
    );
  });

  it("Returns correct gold price from oracle", async () => {
    const price = await goldBond.getGoldPrice();
    expect(price).to.equal(196000000000n);
  });

  it("Owner can whitelist a wallet", async () => {
    await goldBond.addToWhitelist(user1.address);
    expect(await goldBond.whitelist(user1.address)).to.be.true;
  });

  it("Cannot mint to non-whitelisted wallet", async () => {
    await expect(
      goldBond.mint(user1.address, 1, 1000)
    ).to.be.revertedWith("GoldBond: wallet not KYC verified");
  });

  it("Can mint to whitelisted wallet", async () => {
    await goldBond.addToWhitelist(user1.address);
    await goldBond.mint(user1.address, 1, 1000);
    expect(await goldBond.balanceOf(user1.address, 1)).to.equal(1000n);
  });

  it("Cannot transfer to non-whitelisted wallet", async () => {
    await goldBond.addToWhitelist(user1.address);
    await goldBond.mint(user1.address, 1, 500);
    await expect(
      goldBond.connect(user1).safeTransferFrom(user1.address, user2.address, 1, 100, "0x")
    ).to.be.revertedWith("GoldBond: recipient not KYC verified");
  });

  it("Calculates accrued interest correctly", async () => {
    await goldBond.addToWhitelist(user1.address);
    await goldBond.mint(user1.address, 1, 10000); // 10 grams

    // Fast-forward 1 year
    await ethers.provider.send("evm_increaseTime", [31536000]);
    await ethers.provider.send("evm_mine");

    const interest = await goldBond.calculateAccruedInterest(user1.address, 1);
    // 10000 * 250 * 31536000 / (31536000 * 10000) = 250 tokens (2.5%)
    expect(interest).to.equal(250n);
  });

  it("Can redeem bonds", async () => {
    await goldBond.addToWhitelist(user1.address);
    await goldBond.mint(user1.address, 1, 1000);
    await goldBond.connect(user1).redeem(1, 500);
    expect(await goldBond.balanceOf(user1.address, 1)).to.equal(500n);
  });
});

describe("Marketplace", function () {
  let goldBond, marketplace, owner, seller, buyer;
  let mockFeed;

  beforeEach(async () => {
    [owner, seller, buyer] = await ethers.getSigners();

    const MockFeed = await ethers.getContractFactory("MockAggregator");
    mockFeed = await MockFeed.deploy(196000000000n);

    const GoldBond = await ethers.getContractFactory("GoldBond");
    goldBond = await GoldBond.deploy(
      await mockFeed.getAddress(),
      await mockFeed.getAddress()
    );

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(await goldBond.getAddress());

    // Whitelist both seller and buyer + marketplace
    await goldBond.addToWhitelist(seller.address);
    await goldBond.addToWhitelist(buyer.address);
    await goldBond.addToWhitelist(await marketplace.getAddress());

    // Mint bonds to seller
    await goldBond.mint(seller.address, 1, 1000);

    // Approve marketplace to move seller's tokens
    await goldBond.connect(seller).setApprovalForAll(
      await marketplace.getAddress(), true
    );
  });

  it("Seller can list bonds", async () => {
    const pricePerUnit = ethers.parseEther("0.001"); // 0.001 MATIC per token
    await marketplace.connect(seller).listBond(1, 500, pricePerUnit);
    const listing = await marketplace.getActiveListing(0);
    expect(listing.active).to.be.true;
    expect(listing.amount).to.equal(500n);
  });

  it("Buyer can purchase listed bonds", async () => {
    const pricePerUnit = ethers.parseEther("0.001");
    await marketplace.connect(seller).listBond(1, 500, pricePerUnit);

    const totalPrice = pricePerUnit * 500n;
    await marketplace.connect(buyer).buyBond(0, { value: totalPrice });

    expect(await goldBond.balanceOf(buyer.address, 1)).to.equal(500n);
    const listing = await marketplace.getActiveListing(0);
    expect(listing.active).to.be.false;
  });

  it("Seller can cancel listing and get tokens back", async () => {
    await marketplace.connect(seller).listBond(1, 500, ethers.parseEther("0.001"));
    await marketplace.connect(seller).cancelListing(0);
    expect(await goldBond.balanceOf(seller.address, 1)).to.equal(1000n);
  });
});
