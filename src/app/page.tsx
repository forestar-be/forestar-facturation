"use client";

import { useAuth, useRequireAuth } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import Header from "@/components/Header";
import ReconciliationDashboard from "@/components/ReconciliationDashboard";

export default function HomePage() {
  // `useRequireAuth` remplace la redirection écrite à la main : en mode SSO,
  // l'absence de session part vers l'IdP plutôt que vers `/connexion`.
  const { ready, denied } = useRequireAuth();
  const { logOut } = useAuth();

  if (denied) return <AccessDenied onLogout={logOut} />;

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <ReconciliationDashboard />
      </main>
    </div>
  );
}
