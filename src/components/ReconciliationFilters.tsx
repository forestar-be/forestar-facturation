import React from "react";
import { Search, Plus, Download } from "lucide-react";
import {
  Button,
  Input,
  MultiCombobox,
  noAutofillProps,
  type ComboboxOption,
} from "@forestar-be/ui";
import SortSelectorWithDirection, { SortConfig } from "./SortSelector";

interface ReconciliationFiltersProps {
  searchTerm: string;
  selectedFilters: string[];
  availableFilterTypes: string[];
  filterTypeCounts: Record<string, number>;
  totalItemsCount: number;
  sortConfig: SortConfig;
  onSearchChange: (searchTerm: string) => void;
  onFiltersChange: (selectedFilters: string[]) => void;
  onSortChange: (config: SortConfig) => void;
  onCreateMatch: () => void;
  onExportExcel: () => void;
}

// Fonction pour obtenir le label d'un type de filtre
const getFilterLabel = (filterType: string, count: number) => {
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

export default function ReconciliationFilters({
  searchTerm,
  selectedFilters,
  availableFilterTypes,
  filterTypeCounts,
  totalItemsCount,
  sortConfig,
  onSearchChange,
  onFiltersChange,
  onSortChange,
  onCreateMatch,
  onExportExcel,
}: ReconciliationFiltersProps) {
  const filterOptions: ComboboxOption[] = availableFilterTypes.map((type) => ({
    value: type,
    label: getFilterLabel(type, filterTypeCounts[type] || 0),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-medium">Filtres des correspondances</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onExportExcel}>
            <Download />
            Export Excel
          </Button>
          <Button onClick={onCreateMatch}>
            <Plus />
            Nouvelle correspondance
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            {...noAutofillProps}
            placeholder="Rechercher par référence, client, libellé..."
            aria-label="Rechercher par référence, client, libellé"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <SortSelectorWithDirection
          sortConfig={sortConfig}
          onSortChange={onSortChange}
        />

        {/* Aucun type coché = « tous les types » : le filtre ne restreint rien. */}
        <MultiCombobox
          options={filterOptions}
          value={selectedFilters}
          onChange={onFiltersChange}
          placeholder={`Tous les types (${totalItemsCount})`}
          searchPlaceholder="Filtrer par type..."
          aria-label="Filtrer par type de correspondance"
          className="lg:w-80"
        />
      </div>
    </div>
  );
}
