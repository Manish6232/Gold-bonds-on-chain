import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { api } from "../utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useGoldPrice() {
  const [prices, setPrices]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive]       = useState(false);

  useEffect(() => {
    // 1. Fetch initial price via REST
    api.getGoldPrice()
      .then((res) => { setPrices(res.data); setLoading(false); })
      .catch(() => setLoading(false));

    // 2. Connect WebSocket for live updates
    const socket = io(API_URL, { transports: ["websocket"] });

    socket.on("connect", () => setLive(true));
    socket.on("disconnect", () => setLive(false));

    socket.on("price-update", (data) => {
      setPrices({ gold: data.gold, silver: data.silver, inrRate: data.inrRate });
      setLoading(false);
    });

    return () => socket.disconnect();
  }, []);

  return { prices, loading, live };
}
