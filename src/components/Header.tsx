"use client";

import { useAuth } from "@/lib/auth";
import { LogOut, History, Home } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

export default function Header() {
  const { logOut, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  const navigation = [
    { name: "Nouvelle réconciliation", href: "/", icon: Home },
    { name: "Historique", href: "/reconciliations", icon: History },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo-70x70.png"
                alt="Forestar Logo"
                width={50}
                height={50}
                className="rounded-full"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  FORESTAR FACTURATION
                </h1>
                <p className="text-sm text-gray-500">Réconciliation Bancaire</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`cursor-pointer inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isActive
                        ? "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500"
                        : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={logOut}
              className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
