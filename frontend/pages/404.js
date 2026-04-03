import Link from "next/link";
import Navbar from "../components/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-32 text-center">
        <div className="text-6xl font-bold text-yellow-400 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-white mb-2">Page not found</h1>
        <p className="text-gray-400 mb-8">This page doesn't exist in AuBlock.</p>
        <Link href="/" className="px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-medium text-sm hover:bg-yellow-400 transition-colors">
          Back to dashboard
        </Link>
      </main>
    </div>
  );
}
