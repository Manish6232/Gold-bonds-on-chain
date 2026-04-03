/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL:              process.env.NEXT_PUBLIC_API_URL              || "http://localhost:3001",
    NEXT_PUBLIC_BOND_ADDRESS:         process.env.NEXT_PUBLIC_BOND_ADDRESS         || "",
    NEXT_PUBLIC_MARKETPLACE_ADDRESS:  process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS  || "",
    NEXT_PUBLIC_WALLETCONNECT_ID:     process.env.NEXT_PUBLIC_WALLETCONNECT_ID     || "demo",
  },
};

module.exports = nextConfig;
