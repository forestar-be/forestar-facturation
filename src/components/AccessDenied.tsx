"use client";

/**
 * R014 — Refus explicite d'une session authentifiée sans rôle admis.
 *
 * Cet écran n'existe qu'en mode SSO. Renvoyer la personne vers l'IdP ne
 * changerait rien à ses rôles et ferait boucler la redirection : le seul geste
 * utile est de fermer la session pour en ouvrir une autre.
 */
export default function AccessDenied({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="mb-2 font-semibold text-red-800">Accès non autorisé</p>
        <p className="mb-4 text-sm text-red-700">
          Votre compte est bien authentifié, mais il ne porte pas les droits
          nécessaires à Forestar Facturation.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
