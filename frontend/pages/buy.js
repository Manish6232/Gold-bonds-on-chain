import { useState } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import KYCBadge from "../components/KYCBadge";
import { usePortfolio } from "../hooks/usePortfolio";
import { useGoldPrice } from "../hooks/useGoldPrice";
import { api } from "../utils/api";

export default function Buy() {
  const { address, isConnected, isVerified, refresh } = usePortfolio();
  const { prices } = useGoldPrice();

  const [tokenId,   setTokenId]   = useState(1); // 1=gold, 2=silver
  const [amountINR, setAmountINR] = useState("");
  const [status,    setStatus]    = useState(null); // null | "loading" | "success" | "error"
  const [result,    setResult]    = useState(null);
  const [errMsg,    setErrMsg]    = useState("");

  const isGold         = tokenId === 1;
  const priceData      = isGold ? prices?.gold : prices?.silver;
  const pricePerGram   = parseFloat(priceData?.perGramINR || 0);
  const gramsEquiv     = amountINR && pricePerGram ? (parseFloat(amountINR) / pricePerGram).toFixed(4) : "0.0000";
  const tokensEquiv    = amountINR && pricePerGram ? Math.floor((parseFloat(amountINR) / pricePerGram) * 1000) : 0;

  const presets = [100, 500, 1000, 5000, 10000];

  const handleBuy = async () => {
    if (!isConnected) return setErrMsg("Connect your wallet first");
    if (!isVerified)  return setErrMsg("Complete KYC verification first");
    if (!amountINR || parseFloat(amountINR) < 10) return setErrMsg("Minimum investment is ₹10");

    setStatus("loading");
    setErrMsg("");
    setResult(null);

    try {
      const data = await api.mintBond({
        walletAddress: address,
        tokenId,
        amountInRupees: parseFloat(amountINR),
      });
      setResult(data);
      setStatus("success");
      setAmountINR("");
      refresh(); // update portfolio
    } catch (err) {
      setStatus("error");
      setErrMsg(err.message);
    }
  };

  return (
    <>
      <Head><title>AuBlock — Buy Bonds</title></Head>
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-10">

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-1">Buy bonds</h1>
            <p className="text-gray-400 text-sm">
              Invest in tokenized sovereign gold or silver bonds. Start from ₹10.
            </p>
          </div>

          {isConnected && (
            <div className="mb-6">
              <KYCBadge isVerified={isVerified} />
            </div>
          )}

          <div className="glass rounded-2xl p-6 space-y-6">

            {/* Bond type selector */}
            <div>
              <label className="block text-sm text-gray-400 mb-3">Select bond type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTokenId(1)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    tokenId === 1
                      ? "border-yellow-500/60 bg-yellow-500/10"
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="font-medium text-yellow-400 mb-0.5">Gold Bond</div>
                  <div className="text-xs text-gray-500">XAU · 2.5% p.a. interest</div>
                  {priceData && tokenId === 1 && (
                    <div className="text-xs text-yellow-400/70 mt-1">
                      ₹{parseFloat(prices?.gold?.perGramINR || 0).toLocaleString("en-IN")}/g
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setTokenId(2)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    tokenId === 2
                      ? "border-gray-400/60 bg-gray-400/10"
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="font-medium text-gray-300 mb-0.5">Silver Bond</div>
                  <div className="text-xs text-gray-500">XAG · 2.5% p.a. interest</div>
                  {prices?.silver && tokenId === 2 && (
                    <div className="text-xs text-gray-400/70 mt-1">
                      ₹{parseFloat(prices?.silver?.perGramINR || 0).toLocaleString("en-IN")}/g
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Investment amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                <input
                  type="number"
                  value={amountINR}
                  onChange={(e) => setAmountINR(e.target.value)}
                  placeholder="Enter amount"
                  min="10"
                  className="w-full pl-8 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 focus:bg-white/8 transition-colors"
                />
              </div>

              {/* Quick presets */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmountINR(p.toString())}
                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                  >
                    ₹{p.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            {/* Live calculation */}
            {amountINR && parseFloat(amountINR) > 0 && (
              <div className={`rounded-xl p-4 border ${isGold ? "border-yellow-500/20 bg-yellow-500/5" : "border-gray-400/15 bg-gray-400/5"}`}>
                <div className="text-sm text-gray-400 mb-3">You will receive</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Gold equivalent</span>
                    <span className={`text-sm font-medium ${isGold ? "text-yellow-400" : "text-gray-300"}`}>
                      {gramsEquiv} grams
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Bond tokens</span>
                    <span className="text-sm font-medium text-white">{tokensEquiv.toLocaleString()} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Annual interest (2.5%)</span>
                    <span className="text-sm font-medium text-green-400">
                      ₹{(parseFloat(amountINR) * 0.025).toFixed(2)}/yr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Gas fee</span>
                    <span className="text-sm font-medium text-green-400">₹0 (covered by AuBlock)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {errMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {errMsg}
              </div>
            )}

            {/* Success */}
            {status === "success" && result && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="text-green-400 font-medium mb-2">Purchase successful!</div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>Tokens issued: <span className="text-white">{result.tokensIssued?.toLocaleString()}</span></div>
                  <div>Equivalent: <span className="text-white">{result.gramsEquivalent}g</span></div>
                  <a
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-400 hover:underline block mt-2"
                  >
                    View transaction ↗
                  </a>
                </div>
              </div>
            )}

            {/* Buy button */}
            <button
              onClick={handleBuy}
              disabled={status === "loading" || !amountINR}
              className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all ${
                status === "loading" || !amountINR
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-yellow-500 text-black hover:bg-yellow-400 active:scale-98"
              }`}
            >
              {status === "loading"
                ? "Processing transaction..."
                : `Buy ${isGold ? "Gold" : "Silver"} Bond${amountINR ? ` · ₹${parseFloat(amountINR).toLocaleString("en-IN")}` : ""}`}
            </button>

            {!isConnected && (
              <p className="text-center text-xs text-gray-600">
                Connect your wallet using the button in the top right
              </p>
            )}
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: "Min. investment", value: "₹10" },
              { label: "Annual interest", value: "2.5%" },
              { label: "Gas fees", value: "₹0" },
            ].map((item) => (
              <div key={item.label} className="glass rounded-xl p-4 text-center border border-white/5">
                <div className="text-lg font-semibold text-yellow-400">{item.value}</div>
                <div className="text-xs text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </>
  );
}
