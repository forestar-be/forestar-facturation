"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/ui/FileUpload";
import ReconciliationProgress from "@/components/ReconciliationProgress";
import { validateCSVFile } from "@/lib/csvUtils";
import { uploadFiles, getReconciliationStatus, getReconciliationResult, getStatusMessage } from "@/lib/api";
import { ReconciliationStorage } from "@/lib/reconciliationStorage";
import { FileText, Play, RefreshCw } from "lucide-react";

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
        status.status.toUpperCase() as any,
        status.progress || 0,
        getStatusMessage(status)
      );

      // Vérifier si terminé
      if (status.status === "COMPLETED") {
        const result = await getReconciliationResult(reconciliationId);
        stopPolling();
        
        // Rediriger vers la page de détails
        if (result?.reconciliationId || reconciliationId) {
          router.push(`/reconciliations/${result?.reconciliationId || reconciliationId}`);
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

  const canReconcile =
    selectedFiles.invoices &&
    selectedFiles.transactions &&
    !loadingStates.reconciliation;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Réconciliation Bancaire
        </h1>
        <p className="mt-2 text-gray-600">
          Importez vos fichiers de factures et d'extraits bancaires pour lancer
          la réconciliation automatique
        </p>
      </div>

      {/* Section d'import des fichiers */}
      {!hasActiveReconciliation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Fichier Factures
              </h2>
            </div>
            <FileUpload
              label="Fichier CSV des factures"
              accept=".csv"
              onFileSelect={handleInvoiceFileSelect}
              loading={loadingStates.invoices}
              error={errors.invoices}
              success={!!selectedFiles.invoices}
              fileName={fileNames.invoices}
            />
            {selectedFiles.invoices && (
              <div className="mt-3 text-sm text-green-600">
                ✓ Fichier sélectionné: {fileNames.invoices}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Fichier Banque
              </h2>
            </div>
            <FileUpload
              label="Fichier CSV des transactions bancaires"
              accept=".csv"
              onFileSelect={handleTransactionFileSelect}
              loading={loadingStates.transactions}
              error={errors.transactions}
              success={!!selectedFiles.transactions}
              fileName={fileNames.transactions}
            />
            {selectedFiles.transactions && (
              <div className="mt-3 text-sm text-green-600">
                ✓ Fichier sélectionné: {fileNames.transactions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section de lancement */}
      {(selectedFiles.invoices ||
        selectedFiles.transactions ||
        hasActiveReconciliation) && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {hasActiveReconciliation
                  ? "Réconciliation en cours"
                  : "Lancer la Réconciliation"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {hasActiveReconciliation
                  ? "Une réconciliation est actuellement en cours de traitement"
                  : canReconcile
                    ? "Tous les fichiers sont prêts, vous pouvez lancer la réconciliation"
                    : "Sélectionnez les deux fichiers pour continuer"}
              </p>
            </div>
            {!hasActiveReconciliation && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleReconciliation}
                  disabled={!canReconcile}
                  className={`
                    cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                    ${
                      canReconcile
                        ? "text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        : "text-gray-400 bg-gray-200 cursor-not-allowed"
                    }
                  `}
                >
                  {loadingStates.reconciliation ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {loadingStates.reconciliation
                    ? "Réconciliation..."
                    : "Lancer la réconciliation"}
                </button>
              </div>
            )}
          </div>

          {errors.reconciliation && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-600 whitespace-pre-line">
                {errors.reconciliation}
              </div>
            </div>
          )}
        </div>
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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Historique des Réconciliations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Consultez vos réconciliations précédentes
              </p>
            </div>
            <button
              onClick={() => router.push("/reconciliations")}
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Voir l'historique
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
