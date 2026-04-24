"use client";

import { AuthProvider } from "./providers/auth-provider";
import { WalletProvider } from "./providers/wallet-provider";
import { ErrorBoundary } from "./components/error-boundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WalletProvider>{children}</WalletProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
