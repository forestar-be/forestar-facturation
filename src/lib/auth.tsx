"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  token: string;
  expiresAt: string;
  loginAction: (
    data: {
      username: string;
      password: string;
    },
    redirectTo?: string
  ) => Promise<{ success: boolean; message: string }>;
  logOut: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: "",
  expiresAt: "",
  loginAction: async () => ({
    success: false,
    message: "Impossible de vous authentifier",
  }),
  logOut: () => {},
  isAuthenticated: false,
  isLoading: true,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const getTokenFromLocalStorage = () => {
  if (typeof window === "undefined") return "";

  const token = localStorage.getItem("facturation_token");
  const expiresAt = localStorage.getItem("facturation_expires_at");

  if (token && expiresAt) {
    if (new Date().getTime() < Number(expiresAt)) {
      return token;
    }
  }
  localStorage.removeItem("facturation_token");
  localStorage.removeItem("facturation_expires_at");
  return "";
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = getTokenFromLocalStorage();
    const savedExpiresAt = localStorage.getItem("facturation_expires_at") || "";

    setToken(savedToken);
    setExpiresAt(savedExpiresAt);
    setIsAuthenticated(!!savedToken);
    setIsLoading(false);
  }, []);

  const loginAction = async (
    data: {
      username: string;
      password: string;
    },
    redirectTo?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_URL}/facturation/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const res = await response.json();
            if (res.message) {
              return { success: false, message: res.message };
            }
          } else {
            const res = await response.text();
            if (res) {
              return { success: false, message: res };
            }
          }
        } catch (error) {
          console.error("Error parsing response:", error);
        }

        return {
          success: false,
          message:
            "Impossible de vous authentifier, veuillez réessayer plus tard",
        };
      }

      const res = await response.json();
      if (res.authentificated) {
        setExpiresAt(res.expiresAt);
        setToken(res.token);
        setIsAuthenticated(true);
        localStorage.setItem("facturation_token", String(res.token));
        localStorage.setItem("facturation_expires_at", String(res.expiresAt));
        router.push(redirectTo || "/");
        return { success: true, message: "Vous êtes connecté" };
      }
      return {
        success: false,
        message:
          "Impossible de vous authentifier, vérifiez vos informations d'identification et réessayez",
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Erreur de connexion, veuillez réessayer",
      };
    }
  };

  const logOut = () => {
    setExpiresAt("");
    setToken("");
    setIsAuthenticated(false);
    localStorage.removeItem("facturation_token");
    localStorage.removeItem("facturation_expires_at");
    router.push("/connexion");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        expiresAt,
        loginAction,
        logOut,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
