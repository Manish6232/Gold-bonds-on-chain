import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { usePortfolio } from "../hooks/usePortfolio";
import { api } from "../utils/api";

export default function KYC() {
  const router = useRouter();
  const { address, isConnected, isVerified, refresh } = usePortfolio();

  const [form, setForm] = useState({ name: "", aadhaarLast4: "", pan: "" });
  const [step, setStep]     = useState(1); // 1=form, 2=verifying, 3=done
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState("");

  const updateForm = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    if (!isConnected) return setError("Connect your wallet first");
    if (!form.name.trim())           return setError("Full name is required");
    if (form.aadhaarLast4.length !== 4) return setError("Enter exactly 4 digits of Aadhaar");

    setStep(2);
    setError("");

    try {
      const data = await api.submitKYC({
        walletAddress: address,
        name:          form.name,
        aadhaarLast4:  form.aadhaarLast4,
        pan:           form.pan,
      });
      setResult(data);
      setStep(3);
      refresh();
    } catch (err) {
      setError(err.message);
      setStep(1);
    }
  };

  return (
    <>
      <Head><title>AuBlock — KYC Verification</title></Head>
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-10">

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-1">KYC Verification</h1>
            <p className="text-gray-400 text-sm">
              One-time identity verification required by RBI for bond investments.
            </p>
          </div>

          {/* Already verified */}
          {isVerified && (
            <div className="glass rounded-2xl p-8 text-center border border-green-500/20">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-xl font-medium text-white mb-2">You're verified</h2>
              <p className="text-gray-400 text-sm mb-2">
                Wallet{" "}
                <span className="font-mono text-gray-300">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>{" "}
                is KYC verified.
              </p>
              <button
                onClick={() => router.push("/buy")}
                className="mt-4 px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-medium text-sm hover:bg-yellow-400 transition-colors"
              >
                Buy bonds now
              </button>
            </div>
          )}

          {/* Step 1: Form */}
          {!isVerified && step === 1 && (
            <div className="glass rounded-2xl p-6 space-y-5">

              {/* Progress indicators */}
              <div className="flex gap-2 mb-2">
                {["Personal info", "Verification", "Done"].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      i === 0 ? "bg-yellow-500 text-black" : "bg-white/10 text-gray-500"
                    }`}>{i + 1}</div>
                    <span className={`text-xs ${i === 0 ? "text-white" : "text-gray-600"}`}>{s}</span>
                    {i < 2 && <div className="w-6 h-px bg-white/10" />}
                  </div>
                ))}
              </div>

              {!isConnected && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                  Connect your wallet before verifying
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">Full name (as per Aadhaar)</label>
                <input
                  value={form.name}
                  onChange={updateForm("name")}
                  placeholder="Rahul Sharma"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Last 4 digits of Aadhaar</label>
                <input
                  value={form.aadhaarLast4}
                  onChange={updateForm("aadhaarLast4")}
                  placeholder="XXXX"
                  maxLength={4}
                  type="tel"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
                <p className="text-xs text-gray-600 mt-1">
                  We only use the last 4 digits for verification. Full Aadhaar is never stored.
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">PAN number (optional)</label>
                <input
                  value={form.pan}
                  onChange={updateForm("pan")}
                  placeholder="ABCDE1234F"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>

              {/* Wallet being verified */}
              {isConnected && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Wallet being whitelisted</div>
                  <div className="font-mono text-sm text-white">{address}</div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!isConnected}
                className={`w-full py-3.5 rounded-xl font-medium text-sm transition-colors ${
                  isConnected
                    ? "bg-yellow-500 text-black hover:bg-yellow-400"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Verify identity
              </button>

              <p className="text-center text-xs text-gray-600">
                Your data is processed securely and never stored on our servers.
              </p>
            </div>
          )}

          {/* Step 2: Verifying */}
          {step === 2 && (
            <div className="glass rounded-2xl p-12 text-center border border-yellow-500/20">
              <div className="w-12 h-12 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-medium text-white mb-2">Verifying identity</h2>
              <p className="text-gray-400 text-sm">Checking details and whitelisting your wallet on-chain...</p>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && result && (
            <div className="glass rounded-2xl p-8 text-center border border-green-500/20">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-xl font-medium text-white mb-2">Verification complete!</h2>
              <p className="text-gray-400 text-sm mb-4">
                Your wallet is now whitelisted on the Polygon blockchain.
              </p>
              <div className="text-xs font-mono bg-white/5 rounded-lg p-3 text-gray-400 mb-4 break-all">
                {address}
              </div>
              {result.txHash && (
                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-yellow-400 hover:underline block mb-4"
                >
                  View on-chain proof ↗
                </a>
              )}
              <button
                onClick={() => router.push("/buy")}
                className="px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-medium text-sm hover:bg-yellow-400 transition-colors"
              >
                Buy your first bond
              </button>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 glass rounded-xl p-4 border border-white/5">
            <div className="text-xs text-gray-500 space-y-1.5">
              <div className="flex gap-2"><span className="text-yellow-500">•</span><span>KYC is required by RBI regulations for all bond purchases</span></div>
              <div className="flex gap-2"><span className="text-yellow-500">•</span><span>Your wallet address is stored on-chain — your personal data is not</span></div>
              <div className="flex gap-2"><span className="text-yellow-500">•</span><span>One-time process — no need to re-verify for future purchases</span></div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
