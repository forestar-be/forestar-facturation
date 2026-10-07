import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@forestar-be/ui";

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

const DEFAULT_VALUE = "default";

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

const optionOf = (value: string | null) =>
  SORT_OPTIONS.find((option) => (option.field ?? DEFAULT_VALUE) === value);

// Sélecteur du champ de tri, suivi du bouton de direction
export function SortSelectorWithDirection({
  sortConfig,
  onSortChange,
}: SortSelectorProps) {
  // Gérer la sélection d'une option
  const handleOptionSelect = (value: string | null) => {
    if (value === null || value === DEFAULT_VALUE) {
      // Tri par défaut : validé puis confiance (décroissant)
      onSortChange({
        field: null,
        direction: "desc",
      });
    } else {
      // Nouveau champ, garder la direction actuelle ou utiliser la direction par défaut
      const initialDirection = value === "confidence" ? "desc" : "asc";
      onSortChange({
        field: value,
        direction:
          sortConfig.field === value ? sortConfig.direction : initialDirection,
      });
    }
  };

  const currentValue = sortConfig.field ?? DEFAULT_VALUE;

  return (
    <div className="flex items-center gap-1">
      <Select value={currentValue} onValueChange={handleOptionSelect}>
        <SelectTrigger aria-label="Trier par" className="w-56">
          <ArrowUpDown className="text-muted-foreground" />
          <SelectValue>
            {(value: string) => optionOf(value)?.label ?? "Tri personnalisé"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start">
          {SORT_OPTIONS.map((option) => (
            <SelectItem
              key={option.field ?? DEFAULT_VALUE}
              value={option.field ?? DEFAULT_VALUE}
            >
              <span className="flex flex-col items-start">
                <span className="font-medium">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() =>
          onSortChange({
            field: sortConfig.field,
            direction: sortConfig.direction === "asc" ? "desc" : "asc",
          })
        }
        title={`Tri ${sortConfig.direction === "asc" ? "croissant" : "décroissant"}`}
        aria-label={`Tri ${sortConfig.direction === "asc" ? "croissant" : "décroissant"}`}
      >
        {sortConfig.direction === "asc" ? <ArrowUp /> : <ArrowDown />}
      </Button>
    </div>
  );
}

// Export par défaut
export default SortSelectorWithDirection;
