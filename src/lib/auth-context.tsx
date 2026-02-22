"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { SpotifyClient } from "@/lib/spotify";
import type { AuthState, SpotifyTokens, SpotifyUser } from "@/lib/types";

interface AuthContextValue extends AuthState {
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  spotifyClient: SpotifyClient | null;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  tokens: null,
  login: () => {},
  logout: () => {},
  spotifyClient: null,
});

const STORAGE_KEY = "goodbai_tokens";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Save tokens to localStorage
  const persistTokens = useCallback((t: SpotifyTokens) => {
    setTokens(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  }, []);

  // Create client synchronously from tokens — no timing gap
  const spotifyClient = useMemo(() => {
    if (!tokens) {
      console.log("[Auth] useMemo: tokens null, no client");
      return null;
    }
    console.log("[Auth] useMemo: creating SpotifyClient with token:", tokens.access_token.substring(0, 10) + "...");
    return new SpotifyClient(tokens.access_token, (newTokens) => {
      persistTokens(newTokens);
    });
  }, [tokens, persistTokens]);

  // Initialize: check for tokens in URL hash (after OAuth callback) or localStorage
  useEffect(() => {
    console.log("[Auth] Init effect running. Hash:", window.location.hash.substring(0, 50));

    // Check URL hash for tokens from OAuth callback
    if (window.location.hash.includes("tokens=")) {
      try {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const tokenStr = hashParams.get("tokens");
        if (tokenStr) {
          const t: SpotifyTokens = JSON.parse(decodeURIComponent(tokenStr));
          console.log("[Auth] Tokens parsed from hash, expires_at:", new Date(t.expires_at).toISOString());
          persistTokens(t);
          // Clean up URL
          window.history.replaceState(null, "", window.location.pathname);
          setIsLoading(false);
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
        console.log("[Auth] Found stored tokens. Expired?", t.expires_at < Date.now(), "expires_at:", new Date(t.expires_at).toISOString());
        // Check if token is expired or about to expire (within 5 min)
        if (t.expires_at > Date.now() + 5 * 60 * 1000) {
          setTokens(t);
          setIsLoading(false);
        } else {
          // Try to refresh
          refreshAndSetTokens();
          return; // setIsLoading(false) will be called after refresh completes
        }
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
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
        localStorage.removeItem(STORAGE_KEY);
        setTokens(null);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setTokens(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user profile when client becomes available
  useEffect(() => {
    if (!spotifyClient) {
      setUser(null);
      return;
    }
    spotifyClient.getCurrentUser().then(setUser).catch(console.error);
  }, [spotifyClient]);

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

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTokens(null);
    setUser(null);
    // Clear server-side cookie, then redirect to landing page
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      window.location.href = "/";
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!tokens,
        isLoading,
        user,
        tokens,
        login,
        logout,
        spotifyClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
