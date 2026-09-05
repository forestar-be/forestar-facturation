/**
 * R014 — Mode d'authentification et client de session partagé.
 *
 * L'application embarque les deux chemins et n'en active qu'un, décidé par
 * `NEXT_PUBLIC_AUTH_MODE`. C-06 impose que l'ancien login reste le seul visible
 * jusqu'à la fenêtre de bascule globale, et C-12 que chaque application soit
 * prête sans être activée : bascule et rollback sont donc un changement de
 * variable, pas un redéploiement de code différent.
 *
 * Le client de session est unique et vit au niveau du module : le provider React
 * et les appels HTTP doivent lire le **même** jeton CSRF.
 */

import { createSessionClient, type SessionClient } from "@forestar-be/core";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/** Vrai quand l'application doit utiliser le SSO plutôt que l'ancien login. */
export const SSO_ENABLED = process.env.NEXT_PUBLIC_AUTH_MODE === "oidc";

/**
 * Rôles admis sur les écrans internes. Le serveur reste l'autorité — la matrice
 * R005 protège `/facturation` — mais refuser ici évite d'afficher une interface
 * complète à quelqu'un dont chaque appel repartira en 403.
 */
export const ALLOWED_ROLES = [
  "forestar.facturation",
  "forestar.admin",
] as const;

let client: SessionClient | null = null;

/**
 * `currentUrl` est fourni explicitement : le défaut de
 * `@forestar-be/core@0.2.0` est un chemin nu, et la redirection finale est
 * exécutée par `/auth/callback`, servi par l'API. Sans l'origine, l'utilisateur
 * atterrirait sur l'API. Correctif porté sur la branche
 * `fix/sso-r011-absolute-return-to` de forestar-frontend.
 */
export function getSessionClient(): SessionClient {
  if (!client) {
    client = createSessionClient({
      baseUrl: API_URL,
      currentUrl: () =>
        typeof window === "undefined" ? "/" : window.location.href,
    });
  }
  return client;
}
