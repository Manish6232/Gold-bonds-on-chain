export default function Spinner({ size = "md", color = "yellow" }) {
  const sizes  = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-2", lg: "w-12 h-12 border-[3px]" };
  const colors = { yellow: "border-yellow-500", white: "border-white", gray: "border-gray-400" };

  return (
    <div
      className={`rounded-full border-t-transparent animate-spin ${sizes[size]} ${colors[color]}`}
    />
  );
}
