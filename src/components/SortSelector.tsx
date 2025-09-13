import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  Check,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export type SortOption = {
  field: string | null;
  label: string;
  description?: string;
};

export type SortConfig = {
  field: string | null;
  direction: "asc" | "desc";
  secondary?: {
    field: string | null;
    direction: "asc" | "desc";
  };
};

interface SortSelectorProps {
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

interface SortDirectionToggleProps {
  direction: "asc" | "desc";
  onToggle: () => void;
  disabled?: boolean;
}

const SORT_OPTIONS: SortOption[] = [
  {
    field: null,
    label: "Tri par défaut",
    description: "Validés à la fin, reste par confiance",
  },
  {
    field: "confidence",
    label: "Confiance",
    description: "Niveau de confiance du match",
  },
  {
    field: "type",
    label: "Type de correspondance",
    description: "Type d'algorithme utilisé",
  },
  {
    field: "validated",
    label: "Statut de validation",
    description: "Validé, rejeté ou en attente",
  },
  {
    field: "amount",
    label: "Montant",
    description: "Montant de la facture",
  },
  {
    field: "date",
    label: "Date",
    description: "Date de la transaction",
  },
];

// Composant pour le bouton de basculement de direction
function SortDirectionToggle({
  direction,
  onToggle,
  disabled = false,
}: SortDirectionToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`px-3 py-[10.8px] border border-l-0 border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500 ${
        disabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
      }`}
      title={
        disabled
          ? "Sélectionnez d'abord un type de tri"
          : `Tri ${direction === "asc" ? "croissant" : "décroissant"}`
      }
    >
      {direction === "asc" ? (
        <ArrowUp className="h-5 w-5" />
      ) : (
        <ArrowDown className="h-5 w-5" />
      )}
    </button>
  );
}

function SortSelector({ sortConfig, onSortChange }: SortSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Obtenir le label du tri actuel
  const getCurrentSortLabel = () => {
    if (!sortConfig.field) {
      return "Tri par défaut";
    }

    const option = SORT_OPTIONS.find((opt) => opt.field === sortConfig.field);
    if (!option) return "Tri personnalisé";

    return option.label;
  };

  // Gérer la sélection d'une option
  const handleOptionSelect = (option: SortOption) => {
    if (option.field === null) {
      // Tri par défaut : validé puis confiance (décroissant)
      onSortChange({
        field: null,
        direction: "desc",
      });
    } else {
      // Nouveau champ, garder la direction actuelle ou utiliser la direction par défaut
      const initialDirection = option.field === "confidence" ? "desc" : "asc";
      onSortChange({
        field: option.field,
        direction:
          sortConfig.field === option.field
            ? sortConfig.direction
            : initialDirection,
      });
    }
    setIsOpen(false);
  };

  // Basculer la direction de tri
  const handleDirectionToggle = () => {
    if (sortConfig.field !== null) {
      onSortChange({
        field: sortConfig.field,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    }
  };

  // Vérifier si une option est sélectionnée
  const isOptionSelected = (option: SortOption) => {
    if (option.field === null && sortConfig.field === null) {
      return true;
    }
    return sortConfig.field === option.field;
  };

  return (
    <div className="relative flex-shrink-0" ref={dropdownRef}>
      <ArrowUpDown className="h-5 w-5 absolute left-3 top-3 text-gray-400 z-10" />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer pl-10 pr-8 py-[10.8px] border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between w-64"
      >
        <span className="truncate text-sm font-medium">
          {getCurrentSortLabel()}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform flex-shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-auto">
          <div className="p-2">
            <div className="space-y-1">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.field || "default"}
                  onClick={() => handleOptionSelect(option)}
                  className="flex items-start p-3 hover:bg-gray-50 rounded cursor-pointer w-full text-left"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isOptionSelected(option) ? (
                      <Check className="h-4 w-4 text-blue-600" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {option.label}
                      </span>
                      {isOptionSelected(option) && (
                        <Check className="h-4 w-4 text-blue-600 ml-2" />
                      )}
                    </div>
                    {option.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {option.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Actions en bas */}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <div className="flex justify-between items-center p-2">
                <div className="text-xs text-gray-500">
                  {sortConfig.field
                    ? `Tri: ${getCurrentSortLabel()}`
                    : "Tri par défaut actif"}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant principal qui combine le sélecteur et le bouton de direction
export function SortSelectorWithDirection({
  sortConfig,
  onSortChange,
}: SortSelectorProps) {
  return (
    <div className="flex items-center">
      <SortSelector sortConfig={sortConfig} onSortChange={onSortChange} />
      <SortDirectionToggle
        direction={sortConfig.direction}
        onToggle={() => {
          onSortChange({
            field: sortConfig.field,
            direction: sortConfig.direction === "asc" ? "desc" : "asc",
          });
        }}
        disabled={false}
      />
    </div>
  );
}

// Export par défaut
export default SortSelectorWithDirection;
