import { create } from "zustand";
import api from "@/lib/api";

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  bio: string;
  preferred_language: string;
  is_private: boolean;
  followers_count: number;
  following_count: number;
}

export interface Tokens {
  access: string;
  refresh: string;
}

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    password2: string;
    preferred_language: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isLoading: false,

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    const tokens = JSON.parse(localStorage.getItem("tvtime_tokens") || "null");
    const user = JSON.parse(localStorage.getItem("tvtime_user") || "null");
    if (tokens && user) {
      set({ tokens, user });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/api/auth/login/", { email, password });
      const tokens: Tokens = data;
      localStorage.setItem("tvtime_tokens", JSON.stringify(tokens));

      // Fetch user profile
      const profileRes = await api.get("/api/me/");
      const user: User = profileRes.data;
      localStorage.setItem("tvtime_user", JSON.stringify(user));
      set({ user, tokens, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error("Login failed");
    }
  },

  register: async (regData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/api/auth/register/", regData);
      const tokens: Tokens = data.tokens;
      const user: User = data.user;
      localStorage.setItem("tvtime_tokens", JSON.stringify(tokens));
      localStorage.setItem("tvtime_user", JSON.stringify(user));
      set({ user, tokens, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error("Registration failed");
    }
  },

  logout: () => {
    localStorage.removeItem("tvtime_tokens");
    localStorage.removeItem("tvtime_user");
    set({ user: null, tokens: null });
  },

  updateUser: async (data) => {
    try {
      const { data: updated } = await api.patch("/api/me/", data);
      localStorage.setItem("tvtime_user", JSON.stringify(updated));
      set({ user: updated });
    } catch {
      throw new Error("Update failed");
    }
  },
}));
