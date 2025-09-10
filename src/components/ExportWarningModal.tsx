"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ExportWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hasFilters: boolean;
  searchTerm: string;
  selectedFilters: string[];
}

const DONT_SHOW_AGAIN_KEY = "export_warning_dont_show_again";

export default function ExportWarningModal({
  isOpen,
  onClose,
  onConfirm,
  hasFilters,
  searchTerm,
  selectedFilters,
}: ExportWarningModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a demandé à ne plus afficher l'avertissement
    const dontShowAgainValue = sessionStorage.getItem(DONT_SHOW_AGAIN_KEY);
    if (dontShowAgainValue === "true" && hasFilters) {
      // Si l'utilisateur a choisi de ne plus afficher et qu'il y a des filtres,
      // procéder directement à l'export
      onConfirm();
      return;
    }
  }, [hasFilters, onConfirm]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (dontShowAgain) {
      sessionStorage.setItem(DONT_SHOW_AGAIN_KEY, "true");
    }
    onConfirm();
  };

  const getFilterBadgeLabel = (filterType: string) => {
    switch (filterType) {
      case "EXACT_REF":
        return "Réf. exacte";
      case "EXACT_AMOUNT":
        return "Montant exact";
      case "REFINED_AMOUNT":
        return "Montant raffiné";
      case "SIMPLE_NAME":
        return "Nom exact";
      case "FUZZY_NAME":
        return "Nom approchant";
      case "COMBINED":
        return "Combiné";
      case "MANUAL":
        return "Manuelles";
      case "MULTIPLE":
        return "Multiples";
      case "NONE":
        return "Non appariées";
      default:
        return filterType;
    }
  };

  const getFilterDescription = () => {
    const descriptions = [];

    if (searchTerm) {
      descriptions.push(`Recherche: "${searchTerm}"`);
    }

    if (selectedFilters.length > 0) {
      const filterLabels = selectedFilters.map((filter) =>
        getFilterBadgeLabel(filter)
      );
      descriptions.push(`Filtres de type: ${filterLabels.join(", ")}`);
    }

    return descriptions;
  };

  const filterDescriptions = getFilterDescription();

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Exporter avec filtres actifs
            </h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            L'export Excel sera effectué avec les filtres actuellement
            appliqués. Seules les données affichées dans le tableau seront
            exportées.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              Paramètres actifs :
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {filterDescriptions.map((desc, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  {desc}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="cursor-pointer h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="dontShowAgain"
              className="cursor-pointer ml-2 text-sm text-gray-600"
            >
              Ne plus afficher cet avertissement pour cette session
            </label>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="cursor-pointer flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="cursor-pointer flex-1 px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Continuer l'export
          </button>
        </div>
      </div>
    </div>
  );
}
