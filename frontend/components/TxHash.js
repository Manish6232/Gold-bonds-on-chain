export default function TxHash({ hash, label = "Transaction" }) {
  if (!hash) return null;
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/8">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="text-xs font-mono text-gray-300 truncate">{hash}</div>
      </div>
      <a
        href={`https://mumbai.polygonscan.com/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-yellow-400 hover:underline whitespace-nowrap"
      >
        View ↗
      </a>
    </div>
  );
}
