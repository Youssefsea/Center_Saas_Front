"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, normalizeApiError } from "../lib/api";

type WalletContextValue = {
  balance: number | null;
  isLoading: boolean;
  refresh: () => Promise<number | null>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const response = await api.get("/wallet/balance", { signal });
      const value = response.data?.balance ?? response.data?.walletBalance ?? null;
      const parsed = typeof value === "number" ? value : null;
      setBalance(parsed);
      return parsed;
    } catch (error) {
      if (signal?.aborted) return null;
      const normalized = normalizeApiError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("token");
    if (token) {
      refresh(controller.signal);
    }
    return () => controller.abort();
  }, [refresh]);

  return (
    <WalletContext.Provider value={{ balance, isLoading, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};
