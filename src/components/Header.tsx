"use client";

import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import Image from "next/image";

export default function Header() {
  const { logOut, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
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

          <div className="flex items-center space-x-4">
            {/* <span className="text-sm text-gray-700">
              Connecté en tant qu'administrateur
            </span> */}
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
