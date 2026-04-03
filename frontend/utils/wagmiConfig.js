import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygonMumbai } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName:   "AuBlock — Tokenized Gold Bonds",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "demo",
  chains:    [polygonMumbai],
  ssr:       true,
});

export const BOND_ADDRESS        = process.env.NEXT_PUBLIC_BOND_ADDRESS;
export const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;
export const API_URL             = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
