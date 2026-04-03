import Link from "next/link";
import { useRouter } from "next/router";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useGoldPrice } from "../hooks/useGoldPrice";

export default function Navbar() {
  const router          = useRouter();
  const { prices, live } = useGoldPrice();

  const navLinks = [
    { href: "/",           label: "Dashboard" },
    { href: "/buy",        label: "Buy Bonds"  },
    { href: "/marketplace",label: "Marketplace"},
    { href: "/kyc",        label: "Verify KYC" },
  ];

  return (
    <nav className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
              <span className="text-yellow-400 font-bold text-sm">Au</span>
            </div>
            <span className="font-semibold text-white text-lg tracking-tight">AuBlock</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  router.pathname === link.href
                    ? "bg-yellow-500/15 text-yellow-400 font-medium"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: live price + wallet */}
          <div className="flex items-center gap-4">
            {/* Live gold price ticker */}
            {prices && (
              <div className="hidden sm:flex items-center gap-3 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                <div className="flex items-center gap-1.5">
                  {live && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                  )}
                  <span className="text-xs text-gray-400">XAU</span>
                  <span className="text-sm font-medium text-yellow-400">
                    ₹{parseFloat(prices.gold?.perGramINR || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}/g
                  </span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">XAG</span>
                  <span className="text-sm font-medium text-gray-300">
                    ₹{parseFloat(prices.silver?.perGramINR || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}/g
                  </span>
                </div>
              </div>
            )}
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            />
          </div>

        </div>
      </div>
    </nav>
  );
}
