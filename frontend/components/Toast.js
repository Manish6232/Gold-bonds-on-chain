import { useState, useEffect } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  return { toasts, show };
}

export function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg border max-w-xs ${
            t.type === "success"
              ? "bg-green-900/90 text-green-300 border-green-500/30"
              : t.type === "error"
              ? "bg-red-900/90 text-red-300 border-red-500/30"
              : "bg-gray-900/90 text-gray-200 border-white/10"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
