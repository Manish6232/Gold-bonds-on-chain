import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { api } from "../utils/api";

export function usePortfolio() {
  const { address, isConnected } = useAccount();

  const [portfolio,    setPortfolio]    = useState(null);
  const [isVerified,   setIsVerified]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setPortfolio(null);
      setIsVerified(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getBalance(address);
        setPortfolio(data.portfolio);
        setIsVerified(data.isVerified);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetch();
    // Refresh every 60 seconds
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, [address, isConnected]);

  const refresh = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await api.getBalance(address);
      setPortfolio(data.portfolio);
      setIsVerified(data.isVerified);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { address, isConnected, portfolio, isVerified, loading, error, refresh };
}
