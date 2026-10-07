"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@forestar-be/ui";

interface ExportWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  searchTerm: string;
  selectedFilters: string[];
}

const DONT_SHOW_AGAIN_KEY = "export_warning_dont_show_again";

/**
 * Vrai quand la personne a demandé, pour cette session, à ne plus voir
 * l'avertissement. C'est à l'appelant de s'en servir au clic sur « Export
 * Excel » : le tester dans la fenêtre elle-même lançait l'export à chaque
 * changement de filtre une fois la case cochée.
 */
export function isExportWarningDismissed(): boolean {
  try {
    return sessionStorage.getItem(DONT_SHOW_AGAIN_KEY) === "true";
  } catch {
    return false;
  }
}

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

export default function ExportWarningModal({
  isOpen,
  onClose,
  onConfirm,
  searchTerm,
  selectedFilters,
}: ExportWarningModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    if (dontShowAgain) {
      try {
        sessionStorage.setItem(DONT_SHOW_AGAIN_KEY, "true");
      } catch {
        // Stockage indisponible : l'avertissement réapparaîtra, rien de plus.
      }
    }
    onConfirm();
  };

  const filterDescriptions: string[] = [];
  if (searchTerm) {
    filterDescriptions.push(`Recherche: "${searchTerm}"`);
  }
  if (selectedFilters.length > 0) {
    filterDescriptions.push(
      `Filtres de type: ${selectedFilters.map(getFilterBadgeLabel).join(", ")}`
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="size-5 text-warning" />
            Exporter avec filtres actifs
          </DialogTitle>
          <DialogDescription>
            L'export Excel sera effectué avec les filtres actuellement
            appliqués. Seules les données affichées dans le tableau seront
            exportées.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-warning/35 bg-warning/15 p-3">
          <h4 className="mb-2 text-sm font-medium">Paramètres actifs :</h4>
          <ul className="space-y-1 text-sm">
            {filterDescriptions.map((desc, index) => (
              <li key={index} className="flex items-center">
                <span className="mr-2 size-2 shrink-0 rounded-full bg-warning" />
                {desc}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="dontShowAgain"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <Label htmlFor="dontShowAgain" className="cursor-pointer font-normal">
            Ne plus afficher cet avertissement pour cette session
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>Continuer l'export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
