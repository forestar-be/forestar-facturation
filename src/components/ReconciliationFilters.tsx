import React, { useState, useRef, useEffect } from "react";
import { Search, Filter, Plus, ChevronDown } from "lucide-react";

interface ReconciliationFiltersProps {
  searchTerm: string;
  selectedFilters: string[];
  availableFilterTypes: string[];
  filterTypeCounts: Record<string, number>;
  totalItemsCount: number;
  onSearchChange: (searchTerm: string) => void;
  onFiltersChange: (selectedFilters: string[]) => void;
  onCreateMatch: () => void;
}

export default function ReconciliationFilters({
  searchTerm,
  selectedFilters,
  availableFilterTypes,
  filterTypeCounts,
  totalItemsCount,
  onSearchChange,
  onFiltersChange,
  onCreateMatch,
}: ReconciliationFiltersProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Gérer les changements de filtres
  const handleFilterToggle = (filterType: string) => {
    if (selectedFilters.includes(filterType)) {
      // Décocher un filtre
      const newFilters = selectedFilters.filter((f) => f !== filterType);
      onFiltersChange(newFilters);
    } else {
      // Cocher un filtre
      const newFilters = [...selectedFilters, filterType];
      onFiltersChange(newFilters);
    }
  };

  // Gérer la sélection/déselection de tous les filtres
  const handleAllTypesToggle = () => {
    if (selectedFilters.length === availableFilterTypes.length) {
      // Si tous les filtres sont sélectionnés, revenir à l'état par défaut (aucun filtre)
      onFiltersChange([]);
    } else {
      // Sinon, sélectionner tous les filtres
      onFiltersChange([...availableFilterTypes]);
    }
  };

  // Vérifier l'état des filtres
  const allTypesMode = selectedFilters.length === 0; // Mode par défaut "tous les types"
  const allIndividualTypesSelected =
    selectedFilters.length === availableFilterTypes.length;
  const allTypesEffectivelySelected =
    allTypesMode || allIndividualTypesSelected;

  // Fonction pour obtenir le label d'un type de filtre
  const getFilterLabel = (filterType: string) => {
    const count = filterTypeCounts[filterType] || 0;
    switch (filterType) {
      case "EXACT_REF":
        return `Référence exacte (${count})`;
      case "EXACT_AMOUNT":
        return `Montant exact (${count})`;
      case "REFINED_AMOUNT":
        return `Montant raffiné (${count})`;
      case "SIMPLE_NAME":
        return `Nom exact (${count})`;
      case "FUZZY_NAME":
        return `Nom approchant (${count})`;
      case "COMBINED":
        return `Combiné (${count})`;
      case "MANUAL":
        return `Manuelles (${count})`;
      case "MULTIPLE":
        return `Multiples ⚠️ (${count})`;
      case "NONE":
        return `Non appariées (${count})`;
      default:
        return `${filterType} (${count})`;
    }
  };

  // Créer le texte du bouton de filtre
  const getFilterButtonText = () => {
    if (allTypesMode) {
      return `Tous les types (${totalItemsCount})`;
    } else if (allIndividualTypesSelected) {
      return `Tous les types (${totalItemsCount})`;
    } else if (selectedFilters.length === 1) {
      return getFilterLabel(selectedFilters[0]);
    } else {
      const totalSelected = selectedFilters.reduce(
        (sum, filter) => sum + (filterTypeCounts[filter] || 0),
        0
      );
      return `${selectedFilters.length} types sélectionnés (${totalSelected})`;
    }
  };

  // Obtenir les badges des filtres sélectionnés pour l'affichage
  const getSelectedFiltersBadges = () => {
    if (selectedFilters.length <= 3) {
      return selectedFilters;
    }
    return selectedFilters.slice(0, 2);
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
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Filtres des correspondances
        </h3>
        <button
          onClick={onCreateMatch}
          className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle correspondance
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par référence, client, libellé..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <Filter className="h-5 w-5 absolute left-3 top-3 text-gray-400 z-10" />
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="cursor-pointer pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between w-80"
          >
            <div className="flex items-center flex-1 min-w-0">
              {allTypesMode || allIndividualTypesSelected ? (
                <span className="truncate">{getFilterButtonText()}</span>
              ) : selectedFilters.length === 1 ? (
                <span className="truncate">{getFilterButtonText()}</span>
              ) : (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  {getSelectedFiltersBadges().map((filter) => (
                    <span
                      key={filter}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {getFilterBadgeLabel(filter)}
                    </span>
                  ))}
                  {selectedFilters.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{selectedFilters.length - 2} autres
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    (
                    {selectedFilters.reduce(
                      (sum, filter) => sum + (filterTypeCounts[filter] || 0),
                      0
                    )}
                    )
                  </span>
                </div>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform flex-shrink-0 ml-2 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2">
                <div className="space-y-1">
                  {/* Option "Tous les types" */}
                  <label
                    className={`flex items-center p-2 rounded ${
                      allTypesEffectivelySelected
                        ? "cursor-not-allowed"
                        : "cursor-pointer hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={allTypesEffectivelySelected}
                      onChange={handleAllTypesToggle}
                      disabled={allTypesEffectivelySelected} // Désactivé quand coché
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span
                      className={`ml-2 text-sm font-medium ${
                        allTypesEffectivelySelected
                          ? "text-gray-500"
                          : "text-gray-700"
                      }`}
                    >
                      Tous les types ({totalItemsCount})
                    </span>
                  </label>

                  {/* Séparateur */}
                  <div className="border-t border-gray-200 my-1"></div>

                  {/* Options individuelles */}
                  {availableFilterTypes.map((filterType) => (
                    <label
                      key={filterType}
                      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(filterType)}
                        onChange={() => handleFilterToggle(filterType)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm">
                        {getFilterLabel(filterType)}
                      </span>
                    </label>
                  ))}

                  {/* Actions en bas */}
                  {selectedFilters.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <div className="flex justify-between p-2">
                        <button
                          type="button"
                          onClick={() => onFiltersChange([])}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Tout effacer
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(false)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Fermer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
