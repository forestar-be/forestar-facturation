"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ReconciliationProgress from "@/components/ReconciliationProgress";
import DolibarrExportHelp from "@/components/DolibarrExportHelp";
import { validateCSVFile } from "@/lib/csvUtils";
import {
  uploadFiles,
  getReconciliationStatus,
  getReconciliationResult,
  getStatusMessage,
} from "@/lib/api";
import { ReconciliationStorage } from "@/lib/reconciliationStorage";
import { FileText, Play, RefreshCw } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  FileDropzone,
  PageHeader,
  Spinner,
} from "@forestar-be/ui";

export default function ReconciliationDashboard() {
  const router = useRouter();

  const [loadingStates, setLoadingStates] = useState({
    invoices: false,
    transactions: false,
    reconciliation: false,
  });

  const [errors, setErrors] = useState({
    invoices: "",
    transactions: "",
    reconciliation: "",
  });

  const [fileNames, setFileNames] = useState({
    invoices: "",
    transactions: "",
  });

  const [uploadProgress, setUploadProgress] = useState<{
    status: string;
    progress: number;
    message: string;
  } | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<{
    invoices: File | null;
    transactions: File | null;
  }>({
    invoices: null,
    transactions: null,
  });

  const [hasActiveReconciliation, setHasActiveReconciliation] = useState(false);

  // Ref pour stocker l'ID du timeout de polling
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Vérifier s'il y a une réconciliation en cours au chargement
  useEffect(() => {
    const activeState = ReconciliationStorage.getState();
    if (
      activeState &&
      (activeState.status === "PENDING" || activeState.status === "PROCESSING")
    ) {
      setHasActiveReconciliation(true);
      setLoadingStates((prev) => ({ ...prev, reconciliation: true }));
      setUploadProgress({
        status: activeState.status.toLowerCase(),
        progress: activeState.progress,
        message: activeState.message || "Réconciliation en cours...",
      });

      // Vider les fichiers sélectionnés pendant la réconciliation
      setSelectedFiles({ invoices: null, transactions: null });
      setFileNames({ invoices: "", transactions: "" });

      // Reprendre le polling
      startPolling(activeState.reconciliationId);
    }

    // Cleanup: arrêter le polling quand le composant est démonté
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
    // Reprise au montage seulement : le polling se relance de lui-même ensuite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fonction de polling simple
  const startPolling = async (reconciliationId: string) => {
    try {
      const status = await getReconciliationStatus(reconciliationId);

      if (!status) {
        setErrors((prev) => ({
          ...prev,
          reconciliation: "Réconciliation non trouvée",
        }));
        stopPolling();
        return;
      }

      // Mettre à jour l'interface
      setUploadProgress({
        status: status.status.toLowerCase(),
        progress: status.progress || 0,
        message: getStatusMessage(status),
      });

      // Mettre à jour le localStorage
      ReconciliationStorage.updateStatus(
        status.status.toUpperCase() as
          | "PENDING"
          | "PROCESSING"
          | "COMPLETED"
          | "ERROR",
        status.progress || 0,
        getStatusMessage(status)
      );

      // Vérifier si terminé
      if (status.status === "COMPLETED") {
        const result = await getReconciliationResult(reconciliationId);
        stopPolling();

        // Rediriger vers la page de détails
        if (result?.reconciliationId || reconciliationId) {
          router.push(
            `/reconciliations/${result?.reconciliationId || reconciliationId}`
          );
        } else {
          router.push("/reconciliations");
        }
        return;
      }

      if (status.status === "ERROR") {
        setErrors((prev) => ({
          ...prev,
          reconciliation: status.error || "Erreur lors de la réconciliation",
        }));
        stopPolling();
        return;
      }

      // Continuer le polling si en cours
      if (status.status === "PENDING" || status.status === "PROCESSING") {
        pollingTimeoutRef.current = setTimeout(() => {
          startPolling(reconciliationId);
        }, 5000);
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        reconciliation: "Erreur lors du suivi: " + (error as Error).message,
      }));
      stopPolling();
    }
  };

  // Fonction pour arrêter le polling
  const stopPolling = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setUploadProgress(null);
    setHasActiveReconciliation(false);
    setLoadingStates((prev) => ({ ...prev, reconciliation: false }));
    ReconciliationStorage.clearState();
  };

  const handleInvoiceFileSelect = async (file: File) => {
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, invoices: validation.message }));
      return;
    }

    setErrors((prev) => ({ ...prev, invoices: "", reconciliation: "" }));
    setSelectedFiles((prev) => ({ ...prev, invoices: file }));
    setFileNames((prev) => ({ ...prev, invoices: file.name }));
  };

  const handleTransactionFileSelect = async (file: File) => {
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, transactions: validation.message }));
      return;
    }

    setErrors((prev) => ({ ...prev, transactions: "", reconciliation: "" }));
    setSelectedFiles((prev) => ({ ...prev, transactions: file }));
    setFileNames((prev) => ({ ...prev, transactions: file.name }));
  };

  const handleReconciliation = async () => {
    if (!selectedFiles.invoices || !selectedFiles.transactions) {
      setErrors((prev) => ({
        ...prev,
        reconciliation:
          "Veuillez sélectionner les deux fichiers avant de lancer la réconciliation",
      }));
      return;
    }

    // Vérifier s'il y a déjà une réconciliation en cours
    if (ReconciliationStorage.hasActiveReconciliation()) {
      setErrors((prev) => ({
        ...prev,
        reconciliation:
          "Une réconciliation est déjà en cours. Veuillez attendre qu'elle se termine.",
      }));
      return;
    }

    setLoadingStates((prev) => ({ ...prev, reconciliation: true }));
    setErrors((prev) => ({ ...prev, reconciliation: "" }));

    try {
      // Upload des fichiers et lancement de la réconciliation
      const uploadResult = await uploadFiles(
        selectedFiles.invoices,
        selectedFiles.transactions
      );

      if (!uploadResult.success || !uploadResult.reconciliationId) {
        // En cas d'erreur d'upload, on reste dans l'interface normale
        throw new Error(uploadResult.message);
      }

      // Seulement si l'upload réussit, on passe en mode "réconciliation active"
      setHasActiveReconciliation(true);

      // Vider les fichiers sélectionnés pendant la réconciliation
      setSelectedFiles({ invoices: null, transactions: null });
      setFileNames({ invoices: "", transactions: "" });

      // Sauvegarder l'état dans localStorage
      ReconciliationStorage.saveState({
        reconciliationId: uploadResult.reconciliationId,
        status: "PENDING",
        progress: 0,
        message: "Traitement des fichiers en cours...",
        startTime: Date.now(),
      });

      // Initialiser le tracking du progrès
      setUploadProgress({
        status: "processing",
        progress: 0,
        message: "Traitement des fichiers en cours...",
      });

      // Démarrer le polling
      startPolling(uploadResult.reconciliationId);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        reconciliation:
          "Erreur lors de la réconciliation:\n" + (error as Error).message,
      }));
      stopPolling();
    }
  };

  // La croix de la zone de dépôt retire le fichier retenu : il n'est plus
  // envoyé au lancement, et l'état de la zone revient à l'invite.
  const handleFileClear = (kind: "invoices" | "transactions") => {
    setSelectedFiles((prev) => ({ ...prev, [kind]: null }));
    setFileNames((prev) => ({ ...prev, [kind]: "" }));
  };

  const canReconcile =
    selectedFiles.invoices &&
    selectedFiles.transactions &&
    !loadingStates.reconciliation;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <PageHeader
        title="Réconciliation Bancaire"
        description="Importez vos fichiers de factures et d'extraits bancaires pour lancer la réconciliation automatique"
      />

      {/* Section d'import des fichiers */}
      {!hasActiveReconciliation && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-4">
              <div className="flex min-h-9 flex-wrap items-center gap-2">
                <FileText className="size-5 text-info" />
                <h2 className="text-lg font-semibold">Fichier Factures</h2>
                <DolibarrExportHelp className="ml-auto" />
              </div>
              <FileDropzone
                label="Fichier CSV des factures"
                accept=".csv"
                hint="Formats acceptés: CSV (max 10MB)"
                onFileSelect={handleInvoiceFileSelect}
                onClear={() => handleFileClear("invoices")}
                loading={loadingStates.invoices}
                error={errors.invoices}
                fileName={fileNames.invoices}
              />
              {selectedFiles.invoices && (
                <div className="text-sm text-success">
                  ✓ Fichier sélectionné: {fileNames.invoices}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <div className="flex min-h-9 items-center gap-2">
                <FileText className="size-5 text-success" />
                <h2 className="text-lg font-semibold">Fichier Banque</h2>
              </div>
              <FileDropzone
                label="Fichier CSV des transactions bancaires"
                accept=".csv"
                hint="Formats acceptés: CSV (max 10MB)"
                onFileSelect={handleTransactionFileSelect}
                onClear={() => handleFileClear("transactions")}
                loading={loadingStates.transactions}
                error={errors.transactions}
                fileName={fileNames.transactions}
              />
              {selectedFiles.transactions && (
                <div className="text-sm text-success">
                  ✓ Fichier sélectionné: {fileNames.transactions}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section de lancement */}
      {(selectedFiles.invoices ||
        selectedFiles.transactions ||
        hasActiveReconciliation) && (
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {hasActiveReconciliation
                    ? "Réconciliation en cours"
                    : "Lancer la Réconciliation"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasActiveReconciliation
                    ? "Une réconciliation est actuellement en cours de traitement"
                    : canReconcile
                      ? "Tous les fichiers sont prêts, vous pouvez lancer la réconciliation"
                      : "Sélectionnez les deux fichiers pour continuer"}
                </p>
              </div>
              {!hasActiveReconciliation && (
                <Button onClick={handleReconciliation} disabled={!canReconcile}>
                  {loadingStates.reconciliation ? (
                    <Spinner size="sm" className="text-current" />
                  ) : (
                    <Play />
                  )}
                  {loadingStates.reconciliation
                    ? "Réconciliation..."
                    : "Lancer la réconciliation"}
                </Button>
              )}
            </div>

            {errors.reconciliation && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3"
              >
                <div className="text-sm whitespace-pre-line text-destructive">
                  {errors.reconciliation}
                </div>
                {errors.reconciliation.includes("fichier factures") && (
                  <DolibarrExportHelp className="mt-2" />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Indicateur de progrès */}
      {uploadProgress && (
        <ReconciliationProgress
          status={uploadProgress.status}
          progress={uploadProgress.progress}
          message={uploadProgress.message}
        />
      )}

      {/* Section nouvelle réconciliation */}
      {!hasActiveReconciliation && (
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Historique des Réconciliations
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Consultez vos réconciliations précédentes
                </p>
              </div>
              <Button onClick={() => router.push("/reconciliations")}>
                <RefreshCw />
                Voir l'historique
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
