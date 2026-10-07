"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Progress,
  Spinner,
} from "@forestar-be/ui";

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
  // Bloquer la fermeture de l'onglet pendant l'export
  React.useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  return (
    // Aucune fermeture possible pendant l'export : ni croix, ni Échap, ni clic
    // à côté.
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg">Export Excel en cours</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <Spinner size="lg" label="Export en cours" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {currentStep}
          </p>

          {progress > 0 && (
            <Progress value={progress} aria-label="Progression de l'export" />
          )}

          <div className="rounded-lg border border-info/25 bg-info/10 p-3">
            <p className="text-xs text-info">
              ⚠️ Veuillez ne pas fermer cette fenêtre pendant l'export. Le
              téléchargement démarrera automatiquement une fois terminé.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
