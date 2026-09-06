"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  AuthProvider as SsoSessionProvider,
  useAuth as useSsoSession,
  type ForestarRole,
} from "@forestar-be/core";
import {
  ALLOWED_ROLES,
  API_URL as SSO_API_URL,
  getSessionClient,
  SSO_ENABLED,
  SSO_SESSION_TOKEN,
} from "./session";

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
  roles: readonly ForestarRole[];
  hasRole: (...roles: ForestarRole[]) => boolean;
  /** Permet aux écrans de savoir quel chemin est actif, sans relire l'env. */
  ssoEnabled: boolean;
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
  roles: [],
  hasRole: () => false,
  ssoEnabled: false,
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

const LegacyAuthProvider = ({ children }: AuthProviderProps) => {
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
        roles: [],
        // Le chemin historique n'a pas de rôles : cette application n'en admet
        // qu'un, et le serveur l'a déjà vérifié à la connexion.
        hasRole: () => isAuthenticated,
        ssoEnabled: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Traduit la session SSO dans le contrat historique consommé par les écrans.
 * Aucun composant lisant `token` n'a été réécrit : en mode SSO la valeur est
 * une sentinelle non vide, donc `api.ts` n'émet pas d'en-tête `Authorization` et s'authentifie
 * par le cookie.
 */
const SsoAuthBridge = ({ children }: AuthProviderProps) => {
  const session = useSsoSession();

  return (
    <AuthContext.Provider
      value={{
        // Sentinelle, pas un jeton : voir `SSO_SESSION_TOKEN`. Une chaîne vide
        // rendait faux les tests `if (!token)` du code hérité.
        token: SSO_SESSION_TOKEN,
        expiresAt: session.expiresAt ?? "",
        loginAction: async (_data, redirectTo) => {
          // `redirectTo` est un chemin interne. Il doit repartir absolu :
          // c'est `/auth/callback`, servi par l'API, qui exécute la
          // redirection finale.
          session.login(
            redirectTo && typeof window !== "undefined"
              ? new URL(redirectTo, window.location.origin).toString()
              : undefined
          );
          return {
            success: true,
            message: "Redirection vers l'authentification Forestar",
          };
        },
        logOut: () => {
          void session.logout();
        },
        isAuthenticated: session.isAuthenticated,
        isLoading: session.isLoading,
        roles: session.roles,
        hasRole: session.hasRole,
        ssoEnabled: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Le chemin est choisi au chargement du module, jamais au rendu : un `if` dans
 * le corps d'un composant ferait varier les hooks appelés d'un rendu à l'autre.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  if (!SSO_ENABLED) return <LegacyAuthProvider>{children}</LegacyAuthProvider>;
  return (
    <SsoSessionProvider client={getSessionClient()} baseUrl={SSO_API_URL}>
      <SsoAuthBridge>{children}</SsoAuthBridge>
    </SsoSessionProvider>
  );
};

/**
 * Garde partagée des pages internes.
 *
 * Les trois écrans protégés portaient chacun la même redirection vers
 * `/connexion`. En mode SSO cette page n'a plus de formulaire : l'absence de
 * session part directement vers l'IdP, en conservant la destination. Une
 * session valide sans rôle admis n'y est pas renvoyée — s'y reconnecter ne
 * changerait rien et bouclerait.
 */
export const useRequireAuth = (): { ready: boolean; denied: boolean } => {
  const { isAuthenticated, isLoading, hasRole, loginAction, ssoEnabled } =
    useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  const denied = ssoEnabled && isAuthenticated && !hasRole(...ALLOWED_ROLES);

  useEffect(() => {
    if (isLoading || isAuthenticated || redirected.current) return;
    redirected.current = true;
    if (ssoEnabled) {
      const destination =
        typeof window === "undefined"
          ? undefined
          : `${window.location.pathname}${window.location.search}`;
      void loginAction({ username: "", password: "" }, destination);
      return;
    }
    router.push("/connexion");
  }, [isAuthenticated, isLoading, loginAction, router, ssoEnabled]);

  return { ready: !isLoading && isAuthenticated && !denied, denied };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
