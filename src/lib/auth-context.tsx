"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { SpotifyClient } from "@/lib/spotify";
import type { AuthState, SpotifyTokens, SpotifyUser } from "@/lib/types";

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  spotifyClient: SpotifyClient | null;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  tokens: null,
  login: () => {},
  logout: async () => {},
  spotifyClient: null,
});

const STORAGE_KEY = "goodbai_tokens";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [client, setClient] = useState<SpotifyClient | null>(null);

  // Save tokens to localStorage
  const persistTokens = useCallback((t: SpotifyTokens) => {
    setTokens(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  }, []);

  // Initialize: check for tokens in URL hash (after OAuth callback) or localStorage
  useEffect(() => {
    // Check URL hash for tokens from OAuth callback
    if (window.location.hash.includes("tokens=")) {
      try {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const tokenStr = hashParams.get("tokens");
        if (tokenStr) {
          const t: SpotifyTokens = JSON.parse(decodeURIComponent(tokenStr));
          persistTokens(t);
          // Clean up URL
          window.history.replaceState(null, "", window.location.pathname);
          return;
        }
      } catch (err) {
        console.error("Failed to parse tokens from URL:", err);
      }
    }

    // Check localStorage for existing tokens
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const t: SpotifyTokens = JSON.parse(stored);
        // Check if token is expired or about to expire (within 5 min)
        if (t.expires_at > Date.now() + 5 * 60 * 1000) {
          setTokens(t);
        } else {
          // Try to refresh
          refreshAndSetTokens();
        }
      }
    } catch {
      // Ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAndSetTokens = async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        const t: SpotifyTokens = await res.json();
        persistTokens(t);
      } else {
        // Clear invalid tokens
        localStorage.removeItem(STORAGE_KEY);
        setTokens(null);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setTokens(null);
    }
  };

  // Create client and fetch user when tokens change
  useEffect(() => {
    if (!tokens) {
      setClient(null);
      setUser(null);
      return;
    }

    const spotifyClient = new SpotifyClient(tokens.access_token, (newTokens) => {
      persistTokens(newTokens);
    });
    setClient(spotifyClient);

    // Fetch user profile
    spotifyClient.getCurrentUser().then(setUser).catch(console.error);
  }, [tokens, persistTokens]);

  // Set up token refresh timer
  useEffect(() => {
    if (!tokens) return;

    const refreshIn = tokens.expires_at - Date.now() - 5 * 60 * 1000; // 5 min before expiry
    if (refreshIn <= 0) {
      refreshAndSetTokens();
      return;
    }

    const timer = setTimeout(refreshAndSetTokens, refreshIn);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  const login = useCallback(() => {
    window.location.href = "/api/auth/login";
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setTokens(null);
    setUser(null);
    setClient(null);
    await fetch("/api/auth/logout", { method: "POST" });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!tokens && !!user,
        user,
        tokens,
        login,
        logout,
        spotifyClient: client,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
