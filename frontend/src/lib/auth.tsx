"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";
import { wsClient } from "./websocket";
import { User } from "./types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    phone?: string;
    username?: string;
    display_name: string;
    password: string;
    avatar_url?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: { display_name?: string; avatar_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then((u) => {
          setUser(u);
          wsClient.connect(token);
        })
        .catch(() => {
          api.setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.login(identifier, password);
    api.setToken(res.access_token);
    setUser(res.user);
    wsClient.connect(res.access_token);
  };

  const register = async (data: {
    phone?: string;
    username?: string;
    display_name: string;
    password: string;
    avatar_url?: string;
  }) => {
    const res = await api.register(data);
    api.setToken(res.access_token);
    setUser(res.user);
    wsClient.connect(res.access_token);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    wsClient.disconnect();
    api.setToken(null);
    setUser(null);
  };

  const updateUser = async (data: { display_name?: string; avatar_url?: string }) => {
    const updated = await api.updateMe(data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
