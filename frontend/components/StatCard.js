export default function StatCard({ label, value, sub, accent = "gold", icon }) {
  const accentClasses = {
    gold:   "border-yellow-500/20 bg-yellow-500/5",
    silver: "border-gray-400/20 bg-gray-400/5",
    green:  "border-green-500/20 bg-green-500/5",
    blue:   "border-blue-500/20 bg-blue-500/5",
  };

  const textClasses = {
    gold:   "text-yellow-400",
    silver: "text-gray-300",
    green:  "text-green-400",
    blue:   "text-blue-400",
  };

  return (
    <div className={`rounded-xl border p-5 ${accentClasses[accent]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={`text-2xl font-semibold ${textClasses[accent]}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
