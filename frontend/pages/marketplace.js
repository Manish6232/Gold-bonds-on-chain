import { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import KYCBadge from "../components/KYCBadge";
import { usePortfolio } from "../hooks/usePortfolio";
import { useGoldPrice } from "../hooks/useGoldPrice";
import { api } from "../utils/api";
import { ethers } from "ethers";
import { useWalletClient, usePublicClient } from "wagmi";
import { MARKETPLACE_ADDRESS, BOND_ADDRESS } from "../utils/wagmiConfig";
import { MARKETPLACE_ABI, GOLD_BOND_ABI } from "../utils/abis";

export default function Marketplace() {
  const { address, isConnected, isVerified, portfolio, refresh } = usePortfolio();
  const { prices } = useGoldPrice();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [listings,     setListings]     = useState([]);
  const [loadingList,  setLoadingList]  = useState(true);
  const [activeTab,    setActiveTab]    = useState("browse"); // browse | sell
  const [buyingId,     setBuyingId]     = useState(null);
  const [buyResult,    setBuyResult]    = useState(null);
  const [buyError,     setBuyError]     = useState("");

  // Sell form state
  const [sellTokenId,  setSellTokenId]  = useState(1);
  const [sellAmount,   setSellAmount]   = useState("");
  const [sellPrice,    setSellPrice]    = useState("");
  const [listStatus,   setListStatus]   = useState(null);
  const [listResult,   setListResult]   = useState(null);
  const [listError,    setListError]    = useState("");

  // Load listings on mount
  useEffect(() => {
    loadListings();
    const interval = setInterval(loadListings, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadListings = async () => {
    try {
      const data = await api.getListings();
      setListings(data.listings || []);
    } catch (err) {
      console.error("Failed to load listings:", err.message);
    } finally {
      setLoadingList(false);
    }
  };

  // ─── BUY a listed bond ────────────────────────────────────────────────────
  const handleBuy = async (listing) => {
    if (!isConnected) return setBuyError("Connect your wallet first");
    if (!isVerified)  return setBuyError("Complete KYC verification first");
    if (listing.seller.toLowerCase() === address?.toLowerCase()) {
      return setBuyError("You cannot buy your own listing");
    }

    setBuyingId(listing.listingId);
    setBuyError("");
    setBuyResult(null);

    try {
      const totalPriceMATIC = listing.totalPriceMATIC;
      const valueWei = ethers.parseEther(totalPriceMATIC.toString());

      // Call Marketplace.buyBond(listingId) from user's wallet
      const hash = await walletClient.writeContract({
        address:      MARKETPLACE_ADDRESS,
        abi:          MARKETPLACE_ABI,
        functionName: "buyBond",
        args:         [BigInt(listing.listingId)],
        value:        valueWei,
      });

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      setBuyResult({
        txHash:  hash,
        grams:   listing.grams,
        tokenType: listing.tokenType,
      });
      setBuyingId(null);
      loadListings();
      refresh();
    } catch (err) {
      setBuyError(err.message?.slice(0, 120) || "Transaction failed");
      setBuyingId(null);
    }
  };

  // ─── LIST / SELL bonds ────────────────────────────────────────────────────
  const handleList = async () => {
    if (!isConnected) return setListError("Connect your wallet first");
    if (!isVerified)  return setListError("Complete KYC verification first");
    if (!sellAmount || parseInt(sellAmount) < 1) return setListError("Enter amount to sell");
    if (!sellPrice  || parseFloat(sellPrice) <= 0) return setListError("Enter price per unit in MATIC");

    setListStatus("loading");
    setListError("");
    setListResult(null);

    try {
      const priceWei = ethers.parseEther(sellPrice.toString());

      // Step 1: Approve Marketplace to move user's bond tokens
      const approveHash = await walletClient.writeContract({
        address:      BOND_ADDRESS,
        abi:          GOLD_BOND_ABI,
        functionName: "setApprovalForAll",
        args:         [MARKETPLACE_ADDRESS, true],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Step 2: List the bond
      const listHash = await walletClient.writeContract({
        address:      MARKETPLACE_ADDRESS,
        abi:          MARKETPLACE_ABI,
        functionName: "listBond",
        args:         [BigInt(sellTokenId), BigInt(sellAmount), priceWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: listHash });

      setListResult({ txHash: listHash });
      setListStatus("success");
      setSellAmount("");
      setSellPrice("");
      loadListings();
      refresh();
    } catch (err) {
      setListError(err.message?.slice(0, 120) || "Listing failed");
      setListStatus("error");
    }
  };

  const goldListings   = listings.filter((l) => l.tokenId === "1");
  const silverListings = listings.filter((l) => l.tokenId === "2");

  return (
    <>
      <Head><title>AuBlock — Marketplace</title></Head>
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-1">Marketplace</h1>
              <p className="text-gray-400 text-sm">
                Buy and sell gold &amp; silver bonds peer-to-peer. No broker. Instant settlement.
              </p>
            </div>
            {isConnected && <KYCBadge isVerified={isVerified} />}
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="text-xs text-gray-500 mb-1">Total listings</div>
              <div className="text-2xl font-semibold text-white">{listings.length}</div>
            </div>
            <div className="glass rounded-xl p-4 border border-yellow-500/10">
              <div className="text-xs text-gray-500 mb-1">Gold bond listings</div>
              <div className="text-2xl font-semibold text-yellow-400">{goldListings.length}</div>
            </div>
            <div className="glass rounded-xl p-4 border border-gray-400/10">
              <div className="text-xs text-gray-500 mb-1">Silver bond listings</div>
              <div className="text-2xl font-semibold text-gray-300">{silverListings.length}</div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-2 mb-6">
            {["browse", "sell"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                  activeTab === t
                    ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {t === "browse" ? "Browse listings" : "Sell your bonds"}
              </button>
            ))}
          </div>

          {/* ── BROWSE TAB ─────────────────────────────────────────────────── */}
          {activeTab === "browse" && (
            <>
              {/* Buy result banner */}
              {buyResult && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="text-green-400 font-medium mb-1">Purchase successful!</div>
                  <div className="text-sm text-gray-400">
                    You received <span className="text-white">{buyResult.grams}g</span> of{" "}
                    <span className="text-white">{buyResult.tokenType}</span> bonds.{" "}
                    <a
                      href={`https://mumbai.polygonscan.com/tx/${buyResult.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-yellow-400 hover:underline"
                    >
                      View transaction ↗
                    </a>
                  </div>
                </div>
              )}

              {buyError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {buyError}
                </div>
              )}

              {loadingList ? (
                <div className="text-center py-16 text-gray-500">Loading listings...</div>
              ) : listings.length === 0 ? (
                <EmptyState onSell={() => setActiveTab("sell")} />
              ) : (
                <div className="space-y-8">
                  {goldListings.length > 0 && (
                    <ListingSection
                      title="Gold Bond Listings"
                      color="yellow"
                      listings={goldListings}
                      address={address}
                      buyingId={buyingId}
                      onBuy={handleBuy}
                      prices={prices?.gold}
                    />
                  )}
                  {silverListings.length > 0 && (
                    <ListingSection
                      title="Silver Bond Listings"
                      color="gray"
                      listings={silverListings}
                      address={address}
                      buyingId={buyingId}
                      onBuy={handleBuy}
                      prices={prices?.silver}
                    />
                  )}
                </div>
              )}
            </>
          )}

          {/* ── SELL TAB ───────────────────────────────────────────────────── */}
          {activeTab === "sell" && (
            <div className="max-w-lg">
              <div className="glass rounded-2xl p-6 space-y-5">

                {/* Bond type */}
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Bond type to sell</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 1, label: "Gold Bond", color: "yellow", balance: portfolio?.gold?.tokens },
                      { id: 2, label: "Silver Bond", color: "gray",   balance: portfolio?.silver?.tokens },
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setSellTokenId(b.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          sellTokenId === b.id
                            ? b.color === "yellow"
                              ? "border-yellow-500/60 bg-yellow-500/10"
                              : "border-gray-400/60 bg-gray-400/10"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className={`font-medium mb-0.5 ${b.color === "yellow" ? "text-yellow-400" : "text-gray-300"}`}>
                          {b.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          You have: {b.balance || "0"} units
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Units to sell
                    <span className="text-gray-600 ml-2">(1 unit = 0.001 gram)</span>
                  </label>
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder="e.g. 500"
                    min="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                  />
                  {sellAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      = {(parseInt(sellAmount || 0) / 1000).toFixed(3)} grams
                    </p>
                  )}
                </div>

                {/* Price per unit */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Price per unit (MATIC)
                  </label>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="e.g. 0.001"
                    step="0.0001"
                    min="0.0001"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                  />
                  {sellAmount && sellPrice && (
                    <p className="text-xs text-gray-500 mt-1">
                      Total listing value:{" "}
                      <span className="text-white">
                        {(parseFloat(sellPrice) * parseInt(sellAmount)).toFixed(4)} MATIC
                      </span>
                    </p>
                  )}
                </div>

                {/* Summary */}
                {sellAmount && sellPrice && (
                  <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Units listed</span>
                      <span className="text-white">{parseInt(sellAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Grams</span>
                      <span className="text-white">{(parseInt(sellAmount) / 1000).toFixed(3)}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total price</span>
                      <span className="text-yellow-400 font-medium">
                        {(parseFloat(sellPrice) * parseInt(sellAmount)).toFixed(4)} MATIC
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Platform fee (0.5%)</span>
                      <span className="text-gray-400">
                        {(parseFloat(sellPrice) * parseInt(sellAmount) * 0.005).toFixed(5)} MATIC
                      </span>
                    </div>
                  </div>
                )}

                {listError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {listError}
                  </div>
                )}

                {listStatus === "success" && listResult && (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="text-green-400 font-medium mb-1">Listing created!</div>
                    <a
                      href={`https://mumbai.polygonscan.com/tx/${listResult.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-yellow-400 hover:underline"
                    >
                      View on explorer ↗
                    </a>
                  </div>
                )}

                <button
                  onClick={handleList}
                  disabled={listStatus === "loading" || !sellAmount || !sellPrice}
                  className={`w-full py-3.5 rounded-xl font-medium text-sm transition-colors ${
                    listStatus === "loading" || !sellAmount || !sellPrice
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-yellow-500 text-black hover:bg-yellow-400"
                  }`}
                >
                  {listStatus === "loading" ? "Creating listing..." : "List bonds for sale"}
                </button>

                <p className="text-xs text-gray-600 text-center">
                  Your tokens are held in escrow until sold or you cancel the listing.
                </p>
              </div>

              {/* My active listings */}
              {isConnected && (
                <MyListings
                  listings={listings.filter(
                    (l) => l.seller.toLowerCase() === address?.toLowerCase()
                  )}
                  walletClient={walletClient}
                  publicClient={publicClient}
                  onRefresh={loadListings}
                />
              )}
            </div>
          )}

        </main>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ListingSection({ title, color, listings, address, buyingId, onBuy, prices }) {
  const isGold = color === "yellow";
  return (
    <div>
      <h2 className={`text-sm font-medium mb-3 ${isGold ? "text-yellow-400" : "text-gray-300"}`}>
        {title} ({listings.length})
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.listingId}
            listing={listing}
            address={address}
            buyingId={buyingId}
            onBuy={onBuy}
            isGold={isGold}
            pricePerGramINR={prices?.perGramINR}
          />
        ))}
      </div>
    </div>
  );
}

function ListingCard({ listing, address, buyingId, onBuy, isGold, pricePerGramINR }) {
  const isOwn    = listing.seller.toLowerCase() === address?.toLowerCase();
  const isBuying = buyingId === listing.listingId;
  const totalMATIC = parseFloat(listing.totalPriceMATIC);

  return (
    <div className={`glass rounded-xl p-5 border transition-all ${
      isGold ? "border-yellow-500/15 hover:border-yellow-500/30" : "border-gray-400/10 hover:border-gray-400/20"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className={`font-medium text-sm ${isGold ? "text-yellow-400" : "text-gray-300"}`}>
            {listing.tokenType}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
          </div>
        </div>
        {isOwn && (
          <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
            Your listing
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <Row label="Amount"       value={`${listing.grams}g (${parseInt(listing.amount).toLocaleString()} units)`} />
        <Row label="Price/unit"   value={`${listing.pricePerUnit} MATIC`} />
        <Row label="Total"        value={`${totalMATIC.toFixed(4)} MATIC`} bold />
        {pricePerGramINR && (
          <Row
            label="~INR value"
            value={`₹${(parseFloat(listing.grams) * parseFloat(pricePerGramINR)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          />
        )}
      </div>

      {/* Buy button */}
      {!isOwn ? (
        <button
          onClick={() => onBuy(listing)}
          disabled={isBuying}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isBuying
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : isGold
              ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25"
              : "bg-gray-400/10 text-gray-300 border border-gray-400/20 hover:bg-gray-400/20"
          }`}
        >
          {isBuying ? "Buying..." : `Buy · ${totalMATIC.toFixed(4)} MATIC`}
        </button>
      ) : (
        <div className="text-center text-xs text-gray-600 py-2">Your own listing</div>
      )}
    </div>
  );
}

function MyListings({ listings, walletClient, publicClient, onRefresh }) {
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (listingId) => {
    setCancellingId(listingId);
    try {
      const hash = await walletClient.writeContract({
        address:      MARKETPLACE_ADDRESS,
        abi:          MARKETPLACE_ABI,
        functionName: "cancelListing",
        args:         [BigInt(listingId)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      onRefresh();
    } catch (err) {
      alert("Cancel failed: " + err.message?.slice(0, 80));
    } finally {
      setCancellingId(null);
    }
  };

  if (listings.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium text-white mb-3">Your active listings</h3>
      <div className="space-y-3">
        {listings.map((l) => (
          <div key={l.listingId} className="glass rounded-xl p-4 border border-white/8 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-white">{l.tokenType} · {l.grams}g</div>
              <div className="text-xs text-gray-500">{l.pricePerUnit} MATIC/unit · Total: {l.totalPriceMATIC} MATIC</div>
            </div>
            <button
              onClick={() => handleCancel(l.listingId)}
              disabled={cancellingId === l.listingId}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {cancellingId === l.listingId ? "Cancelling..." : "Cancel"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onSell }) {
  return (
    <div className="glass rounded-2xl p-16 text-center border border-white/5">
      <div className="text-4xl mb-4">🏪</div>
      <h2 className="text-xl font-medium text-white mb-2">No listings yet</h2>
      <p className="text-gray-400 text-sm mb-6">
        Be the first to list your bonds for sale on the marketplace.
      </p>
      <button
        onClick={onSell}
        className="px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-medium text-sm hover:bg-yellow-400 transition-colors"
      >
        List your bonds
      </button>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between py-1 border-b border-white/5 last:border-none">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs ${bold ? "font-semibold text-white" : "text-gray-300"}`}>{value}</span>
    </div>
  );
}
