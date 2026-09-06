"use client";

import { LockKeyhole, LogOut, RefreshCw } from "lucide-react";
import { roleLabelsOf, type ForestarRole } from "@forestar-be/core";
import { useAuth } from "@/lib/auth";

interface Props {
  /** Nom de l'application, tel qu'une personne la nomme. */
  application: string;
  /** Rôles qui ouvriraient cet écran. */
  allowedRoles: readonly ForestarRole[];
}

/**
 * R028 / R027 n° 14, 15 et 16 — Refus de rôle.
 *
 * L'écran d'origine était aligné à gauche, sans icône, avec un bouton brut, ne
 * nommait pas le rôle manquant, ne disait pas à qui s'adresser, et n'offrait
 * aucune sortie : la déconnexion était la seule issue. « Changer de compte »
 * est la sortie qui manquait — c'est le geste utile quand quelqu'un s'est
 * connecté avec le mauvais compte sur un poste partagé du magasin.
 */
export default function AccessDenied({ application, allowedRoles }: Props) {
  const auth = useAuth();
  const required = roleLabelsOf(allowedRoles);
  const held = roleLabelsOf(auth.roles);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <LockKeyhole className="mx-auto mb-3 h-14 w-14 text-amber-500" />
        <h1 className="mb-2 text-lg font-semibold text-gray-900">
          Accès non autorisé
        </h1>
        <p className="mb-3 text-sm text-gray-600">
          Votre compte est bien authentifié, mais il ne porte pas les droits
          nécessaires à {application}.
        </p>
        <p className="mb-3 text-sm text-gray-600">
          {required.length === 1
            ? `Cet écran demande le rôle « ${required[0]} ».`
            : `Cet écran demande l'un des rôles suivants : ${required.join(", ")}.`}{" "}
          {held.length > 0
            ? `Votre compte porte ${held.join(", ")}.`
            : "Votre compte ne porte aucun rôle Forestar pour l'instant."}
        </p>
        <p className="mb-6 text-sm text-gray-600">
          Si vous pensez devoir y accéder, demandez ce rôle à l&apos;atelier —
          c&apos;est une autorisation à ajouter, pas un problème de mot de passe.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => auth.switchAccount()}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Changer de compte
          </button>
          <button
            type="button"
            onClick={() => auth.logOut()}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
