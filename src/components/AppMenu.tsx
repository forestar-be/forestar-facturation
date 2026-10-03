"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Grip } from "lucide-react";
import { buildAppMenu, groupAppMenu } from "@forestar-be/core";

/**
 * Bouton « Applications » : la liste de tous les sites Forestar, tirée du
 * catalogue de `@forestar-be/core`. Non filtrée par rôle ; chaque lien s'ouvre
 * dans un nouvel onglet pour ne rien faire perdre de la page en cours.
 *
 * Même gabarit que `AccountMenu` (ce front est encore sur `@forestar-be/ui`
 * 0.2, sans menu déroulant partagé). Sur grand écran il est dans l'en-tête et
 * la liste s'ouvre en dessous ; sur téléphone il est en pied du tiroir et la
 * liste s'ouvre au-dessus.
 */
export default function AppMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const sections = groupAppMenu(buildAppMenu({ current: "facturation" }));

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative max-sm:static" ref={root}>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Applications"
        title="Applications"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
      >
        <Grip className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Applications"
          className="absolute z-50 max-h-[calc(100vh-6rem)] w-80 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg right-0 mt-2 max-sm:inset-x-2 max-sm:top-full max-sm:w-auto"
        >
          {sections.map((section, index) => (
            <div
              key={section.group}
              role="group"
              aria-label={section.label}
              className={index > 0 ? "mt-1 border-t border-gray-100 pt-1" : ""}
            >
              <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {section.label}
              </p>
              {section.entries.map((entry) =>
                entry.current ? (
                  <div
                    key={entry.id}
                    aria-current="page"
                    className="mx-1 flex items-start gap-2 rounded-md bg-green-50 px-2 py-1.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-900">
                        {entry.label}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {entry.description}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-green-700/15 px-2 py-0.5 text-[11px] font-medium text-green-800">
                      Vous êtes ici
                    </span>
                  </div>
                ) : (
                  <a
                    key={entry.id}
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="mx-1 flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-900">
                        {entry.label}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {entry.description}
                      </span>
                    </span>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-40" />
                  </a>
                ),
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
