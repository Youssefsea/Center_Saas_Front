"use client";


import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Role = "student" | "teacher" | "center_admin" | "super_admin";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  role: Role | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isReady: boolean;
};

type JwtPayload = {
  id: string;
  email: string;
  role: Role;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const decodeToken = (token: string): AuthUser | null => {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    if (!payload?.id || !payload?.email || !payload?.role) {
      console.error("Invalid JWT payload shape.");
      return null;
    }
    return { id: payload.id, email: payload.email, role: payload.role };
  } catch (error) {
    console.error("Failed to decode JWT.", error);
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      const decoded = decodeToken(storedToken);
      if (decoded) {
        setToken(storedToken);
        setUser(decoded);
      } else {
        localStorage.removeItem("token");
      }
    }
    setIsReady(true);
  }, []);

  const login = (newToken: string) => {
    const decoded = decodeToken(newToken);
    if (!decoded) return;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      role: user?.role ?? null,
      login,
      logout,
      isAuthenticated: Boolean(token),
      isReady,
    }),
    [user, token, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
