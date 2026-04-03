import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import KYCBadge from "../components/KYCBadge";
import { usePortfolio } from "../hooks/usePortfolio";
import { useGoldPrice } from "../hooks/useGoldPrice";

export default function Dashboard() {
  const { address, isConnected, portfolio, isVerified, loading } = usePortfolio();
  const { prices, live } = useGoldPrice();

  return (
    <>
      <Head>
        <title>AuBlock — Dashboard</title>
      </Head>
      <div className="min-h-screen">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-1">Portfolio</h1>
              <p className="text-gray-400 text-sm">
                Your tokenized gold &amp; silver bonds on Polygon
              </p>
            </div>
            {isConnected && <KYCBadge isVerified={isVerified} />}
          </div>

          {/* Not connected state */}
          {!isConnected && (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">🔗</div>
              <h2 className="text-xl font-medium text-white mb-2">Connect your wallet</h2>
              <p className="text-gray-400 text-sm mb-6">
                Connect MetaMask to view your gold bond portfolio
              </p>
              <p className="text-gray-500 text-xs">
                Use the "Connect Wallet" button in the top right corner
              </p>
            </div>
          )}

          {/* Loading */}
          {isConnected && loading && (
            <div className="text-center py-20 text-gray-400">Loading portfolio...</div>
          )}

          {/* Portfolio */}
          {isConnected && !loading && portfolio && (
            <>
              {/* Total value banner */}
              <div className="glass rounded-2xl p-6 mb-6 border border-yellow-500/20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total portfolio value</div>
                    <div className="text-4xl font-semibold gold-shimmer">
                      ₹{parseFloat(portfolio.totalValueINR).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/buy"
                      className="px-5 py-2.5 rounded-xl bg-yellow-500 text-black font-medium text-sm hover:bg-yellow-400 transition-colors"
                    >
                      Buy bonds
                    </Link>
                    <Link
                      href="/marketplace"
                      className="px-5 py-2.5 rounded-xl border border-white/15 text-white text-sm hover:bg-white/5 transition-colors"
                    >
                      Marketplace
                    </Link>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  label="Gold holdings"
                  value={`${portfolio.gold.grams}g`}
                  sub={`₹${parseFloat(portfolio.gold.valueINR).toLocaleString("en-IN")}`}
                  accent="gold"
                />
                <StatCard
                  label="Silver holdings"
                  value={`${portfolio.silver.grams}g`}
                  sub={`₹${parseFloat(portfolio.silver.valueINR).toLocaleString("en-IN")}`}
                  accent="silver"
                />
                <StatCard
                  label="Interest earned (gold)"
                  value={`₹${parseFloat(portfolio.gold.interestEarned.valueINR).toLocaleString("en-IN")}`}
                  sub={`${portfolio.gold.interestEarned.grams}g @ 2.5% p.a.`}
                  accent="green"
                />
                <StatCard
                  label="Interest earned (silver)"
                  value={`₹${parseFloat(portfolio.silver.interestEarned.valueINR).toLocaleString("en-IN")}`}
                  sub={`${portfolio.silver.interestEarned.grams}g @ 2.5% p.a.`}
                  accent="green"
                />
              </div>

              {/* Bond cards */}
              <div className="grid md:grid-cols-2 gap-6">
                <BondCard
                  type="Gold"
                  symbol="XAU"
                  data={portfolio.gold}
                  priceData={prices?.gold}
                  color="yellow"
                />
                <BondCard
                  type="Silver"
                  symbol="XAG"
                  data={portfolio.silver}
                  priceData={prices?.silver}
                  color="gray"
                />
              </div>

              {/* Wallet address */}
              <div className="mt-6 glass rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">Connected wallet</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-300">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <a
                    href={`https://mumbai.polygonscan.com/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-yellow-400 hover:underline"
                  >
                    View on explorer ↗
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Live price section */}
          {prices && (
            <div className="mt-8 glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-white">Live market prices</span>
                {live && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                    Live via Chainlink
                  </span>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <PriceRow label="Gold (XAU/oz)" usd={prices.gold?.usd} inr={prices.gold?.inr} perGramINR={prices.gold?.perGramINR} color="yellow" />
                <PriceRow label="Silver (XAG/oz)" usd={prices.silver?.usd} inr={prices.silver?.inr} perGramINR={prices.silver?.perGramINR} color="gray" />
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}

function BondCard({ type, symbol, data, priceData, color }) {
  const isGold = color === "yellow";
  return (
    <div className={`glass rounded-xl p-5 border ${isGold ? "border-yellow-500/20" : "border-gray-400/15"}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
          isGold ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-400/20 text-gray-300"
        }`}>
          {symbol}
        </div>
        <div>
          <div className="font-medium text-white">{type} Bond</div>
          <div className="text-xs text-gray-500">Sovereign grade · 2.5% p.a.</div>
        </div>
      </div>

      <div className="space-y-2">
        <Row label="Holdings" value={`${data.grams}g (${data.tokens} units)`} />
        <Row label="Current value" value={`₹${parseFloat(data.valueINR).toLocaleString("en-IN")}`} />
        <Row label="Price per gram" value={`₹${parseFloat(data.pricePerGram || priceData?.perGramINR || 0).toLocaleString("en-IN")}`} />
        <Row label="Interest earned" value={`₹${parseFloat(data.interestEarned.valueINR).toLocaleString("en-IN")}`} highlight />
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-none">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? "text-green-400" : "text-white"}`}>{value}</span>
    </div>
  );
}

function PriceRow({ label, usd, inr, perGramINR, color }) {
  const isGold = color === "yellow";
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/3">
      <div>
        <div className="text-sm text-gray-400">{label}</div>
        <div className={`text-xs mt-0.5 ${isGold ? "text-yellow-500" : "text-gray-400"}`}>
          ₹{parseFloat(perGramINR || 0).toLocaleString("en-IN")}/gram
        </div>
      </div>
      <div className="text-right">
        <div className={`text-lg font-semibold ${isGold ? "text-yellow-400" : "text-gray-300"}`}>
          ${parseFloat(usd || 0).toLocaleString("en-US")}
        </div>
        <div className="text-xs text-gray-500">₹{parseFloat(inr || 0).toLocaleString("en-IN")}</div>
      </div>
    </div>
  );
}
