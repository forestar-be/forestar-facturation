"use client";

import { Spinner } from "@forestar-be/ui";
import AccessDenied from "@/components/AccessDenied";
import { useRequireAuth } from "@/lib/auth";
import { ALLOWED_ROLES } from "@/lib/session";

/**
 * Garde des écrans internes.
 *
 * `useRequireAuth` porte la redirection : en mode SSO, l'absence de session part
 * vers l'IdP plutôt que vers `/connexion`, et une session sans rôle admis reçoit
 * un refus explicite plutôt qu'une boucle de reconnexion.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, denied } = useRequireAuth();

  if (denied) {
    return (
      <AccessDenied application="Facturation" allowedRoles={ALLOWED_ROLES} />
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
