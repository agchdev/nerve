"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function CoinsBadge({ userId, className = "" }) {
  const [coins, setCoins] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCoins = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/monedas?userId=${encodeURIComponent(userId)}`
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (isMountedRef.current) setCoins(0);
        return;
      }

      const value = Number(data?.coins);
      if (isMountedRef.current) {
        setCoins(Number.isFinite(value) ? value : 0);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setCoins(0);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setCoins(null);
      setIsLoading(false);
      return;
    }

    fetchCoins();
  }, [fetchCoins, userId]);

  useEffect(() => {
    if (!userId) return;

    const handleRefresh = () => {
      fetchCoins();
    };

    window.addEventListener("coins:refresh", handleRefresh);
    return () => {
      window.removeEventListener("coins:refresh", handleRefresh);
    };
  }, [fetchCoins, userId]);

  if (!userId) return null;

  return (
    <div
      className={`pointer-events-none absolute right-4 top-14 z-30 rounded-full border border-white/20 bg-[rgba(6,8,16,0.75)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/80 sm:right-6 sm:top-6 ${className}`}
    >
      Monedas{" "}
      <span className="ml-2 text-[12px] text-[#ff9ffc]">
        {isLoading ? "..." : coins ?? 0}
      </span>
    </div>
  );
}
