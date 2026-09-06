"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Key,
  LogOut,
  Building2,
  UserCog,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  buildAccountMenu,
  displayNameOf,
  initialsOf,
  roleLabelsOf,
} from "@forestar-be/core";
import { useAuth } from "@/lib/auth";
import { SSO_ISSUER } from "@/lib/session";

const ICONS: Record<string, typeof Key> = {
  password: Key,
  profile: UserCog,
  "admin-users": Users,
  "admin-org": Building2,
};

/**
 * R028 — Bouton avatar et menu de compte.
 *
 * Remplace le bouton « Déconnexion » isolé : l'identité était invisible, et il
 * n'existait aucun chemin vers le changement de mot de passe ou la double
 * vérification autrement qu'en demandant à quelqu'un.
 *
 * Les entrées de compte ouvrent la console de l'IdP dans un nouvel onglet —
 * l'application n'est pas quittée. « Changer de compte » repart vers l'IdP avec
 * `prompt=select_account`; sans ce prompt la session en cours serait rouverte
 * en silence et le bouton paraîtrait inerte.
 */
interface Props {
  /**
   * Garde optionnelle jouée avant de quitter l'application. Elle renvoie `false`
   * pour annuler. `forestar-installer` s'en sert pour conserver sa confirmation
   * de déconnexion; les autres applications n'en ont pas.
   */
  beforeLeave?: () => boolean;
}

export default function AccountMenu({ beforeLeave }: Props = {}) {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Fermeture au clic extérieur et à Échap : un menu qui reste ouvert derrière
  // la page est plus gênant que pas de menu du tout.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // En mode historique il n'y a ni identité ni console : le bouton de
  // déconnexion d'origine reste le bon rendu.
  if (!auth.ssoEnabled) return null;

  const entries = buildAccountMenu({ issuer: SSO_ISSUER, roles: auth.roles });
  const accountEntries = entries.filter((e) => e.group === "account");
  const adminEntries = entries.filter((e) => e.group === "admin");
  const roles = roleLabelsOf(auth.roles);

  const itemClass =
    "flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none";

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mon compte"
        className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white py-1 pl-1 pr-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-xs font-semibold text-white">
          {initialsOf(auth.user)}
        </span>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
        >
          <div className="border-b border-gray-100 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-gray-900">
              {displayNameOf(auth.user)}
            </p>
            {auth.user?.email && (
              <p className="truncate text-xs text-gray-500">{auth.user.email}</p>
            )}
            {roles.length > 0 && (
              <p className="mt-0.5 text-xs text-gray-500">{roles.join(" · ")}</p>
            )}
          </div>

          {accountEntries.map((entry) => {
            const Icon = ICONS[entry.id] ?? Key;
            return (
              <a
                key={entry.id}
                href={entry.href}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                <Icon className="h-4 w-4 opacity-70" />
                <span className="flex-1 text-left">{entry.label}</span>
                <ExternalLink className="h-3 w-3 opacity-40" />
              </a>
            );
          })}

          {adminEntries.length > 0 && (
            <p className="border-t border-gray-100 px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Administration
            </p>
          )}
          {adminEntries.map((entry) => {
            const Icon = ICONS[entry.id] ?? Key;
            return (
              <a
                key={entry.id}
                href={entry.href}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                <Icon className="h-4 w-4 opacity-70" />
                <span className="flex-1 text-left">{entry.label}</span>
                <ExternalLink className="h-3 w-3 opacity-40" />
              </a>
            );
          })}

          <div className="border-t border-gray-100">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                if (beforeLeave && !beforeLeave()) return;
                auth.switchAccount();
              }}
              className={`${itemClass} cursor-pointer`}
            >
              <RefreshCw className="h-4 w-4 opacity-70" />
              <span className="flex-1 text-left">Changer de compte</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                if (beforeLeave && !beforeLeave()) return;
                auth.logOut();
              }}
              className={`${itemClass} cursor-pointer`}
            >
              <LogOut className="h-4 w-4 opacity-70" />
              <span className="flex-1 text-left">Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
