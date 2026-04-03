import Link from "next/link";

export default function KYCBadge({ isVerified }) {
  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        KYC Verified
      </span>
    );
  }
  return (
    <Link href="/kyc">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-colors cursor-pointer">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Not Verified — Click to verify
      </span>
    </Link>
  );
}
