"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/api";
import {
  clearAuth,
  getStoredUser,
  getToken,
  setAuth,
} from "@/lib/auth";

import type {
  LoginRequest,
  RegisterRequest,
  User,
} from "@/types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      const storedUser = getStoredUser();

      if (!token) {
        setLoading(false);
        return;
      }

      if (storedUser) {
        setUser(storedUser);
      }

      try {
        const response = await api.get("/auth/me");

        const currentUser = response.data.data;

        setUser(currentUser);

        localStorage.setItem(
          "user",
          JSON.stringify(currentUser)
        );
      } catch {
        clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (
    credentials: LoginRequest
  ): Promise<User> => {
    const response = await api.post(
      "/auth/login",
      credentials
    );

    const { token, user } = response.data.data;

    setAuth(token, user);
    setUser(user);

    return user;
  };

  const register = async (
    data: RegisterRequest
  ): Promise<void> => {
    await api.post("/auth/register", data);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}