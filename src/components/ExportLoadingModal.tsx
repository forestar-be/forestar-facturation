"use client";

import React from "react";
import { Loader2, X } from "lucide-react";

interface ExportLoadingModalProps {
  isOpen: boolean;
  progress?: number;
  currentStep?: string;
}

export default function ExportLoadingModal({
  isOpen,
  progress = 0,
  currentStep = "Préparation de l'export...",
}: ExportLoadingModalProps) {
  if (!isOpen) return null;

  // Bloquer la fermeture de l'onglet pendant l'export
  React.useEffect(() => {
    if (isOpen) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue =
          "Un export Excel est en cours. Êtes-vous sûr de vouloir quitter ?";
        return e.returnValue;
      };

      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [isOpen]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Export Excel en cours
          </h3>
          {/* Pas de bouton de fermeture pendant l'export */}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>

          <p className="text-sm text-gray-600 text-center mb-4">
            {currentStep}
          </p>

          {progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-600">
              ⚠️ Veuillez ne pas fermer cette fenêtre pendant l'export. Le
              téléchargement démarrera automatiquement une fois terminé.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
