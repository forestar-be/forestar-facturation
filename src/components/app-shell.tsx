"use client";

import { History, Home } from "lucide-react";
import {
  AppShell as SharedAppShell,
  ThemeToggle,
  type AppShellNavItem,
} from "@forestar-be/ui";
import AccountMenu from "@/components/AccountMenu";
import AppMenu from "@/components/AppMenu";
import { useAuth } from "@/lib/auth";

const navItems: AppShellNavItem[] = [
  { href: "/", label: "Nouveau rapprochement", icon: Home },
  { href: "/reconciliations", label: "Historique", icon: History },
];

const logo = (
  <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/logo-70x70.png" alt="" className="size-9 dark:hidden" />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/logo-dark-70x70.png"
      alt=""
      className="hidden size-9 dark:block"
    />
  </>
);

/** L'accueil ne doit pas rester actif sur toutes les pages. */
const isItemActive = (item: { href: string }, pathname: string) =>
  item.href === "/"
    ? pathname === "/"
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { logOut, ssoEnabled } = useAuth();

  return (
    <SharedAppShell
      navItems={navItems}
      brand={{ title: "Rapprochement", logo, href: "/" }}
      onLogout={logOut}
      // Sans slot, AppShell affiche son bouton de déconnexion : c'est le rendu
      // voulu en mode historique, qui n'a ni identité ni console.
      accountSlot={ssoEnabled ? <AccountMenu /> : undefined}
      headerSlot={
        <>
          <ThemeToggle />
          <AppMenu />
        </>
      }
      isItemActive={isItemActive}
    >
      {children}
    </SharedAppShell>
  );
}
