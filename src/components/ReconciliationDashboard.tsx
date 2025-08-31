"use client";

import { useState, useEffect } from "react";
import FileUpload from "@/components/ui/FileUpload";
import ReconciliationResults from "@/components/ReconciliationResults";
import ReconciliationProgress from "@/components/ReconciliationProgress";
import { ReconciliationResult } from "@/types";
import { validateCSVFile } from "@/lib/csvUtils";
import { uploadFiles, pollReconciliationStatusAsync } from "@/lib/api";
import { ReconciliationStorage } from "@/lib/reconciliationStorage";
import { FileText, Play, RefreshCw } from "lucide-react";

export default function ReconciliationDashboard() {
  const [reconciliationResult, setReconciliationResult] =
    useState<ReconciliationResult | null>(null);

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
  const [showNewReconciliationConfirm, setShowNewReconciliationConfirm] =
    useState(false);

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
      continuePolling(activeState.reconciliationId);
    }
  }, []);

  const continuePolling = async (reconciliationId: string) => {
    try {
      const result = await pollReconciliationStatusAsync(
        reconciliationId,
        (status) => {
          setUploadProgress({
            status: status.status,
            progress: status.progress || 0,
            message: status.message || "Traitement en cours...",
          });

          // Mettre à jour le localStorage
          ReconciliationStorage.updateStatus(
            status.status.toUpperCase() as any,
            status.progress || 0,
            status.message
          );
        }
      );

      setReconciliationResult(result);
      setUploadProgress(null);
      setHasActiveReconciliation(false);
      ReconciliationStorage.clearState();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        reconciliation:
          "Erreur lors de la réconciliation:\n" + (error as Error).message,
      }));
      setUploadProgress(null);
      setHasActiveReconciliation(false);
      ReconciliationStorage.clearState();
    } finally {
      setLoadingStates((prev) => ({ ...prev, reconciliation: false }));
    }
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
    setReconciliationResult(null);

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
      }); // Polling du statut
      const result = await pollReconciliationStatusAsync(
        uploadResult.reconciliationId,
        (status) => {
          setUploadProgress({
            status: status.status,
            progress: status.progress || 0,
            message: status.message || "Traitement en cours...",
          });

          // Mettre à jour le localStorage
          ReconciliationStorage.updateStatus(
            status.status.toUpperCase() as any,
            status.progress || 0,
            status.message
          );
        }
      );

      setReconciliationResult(result);
      setUploadProgress(null);
      setHasActiveReconciliation(false);
      ReconciliationStorage.clearState();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        reconciliation:
          "Erreur lors de la réconciliation:\n" + (error as Error).message,
      }));
      setUploadProgress(null);
      setHasActiveReconciliation(false);
      ReconciliationStorage.clearState();
    } finally {
      setLoadingStates((prev) => ({ ...prev, reconciliation: false }));
    }
  };

  const canReconcile =
    selectedFiles.invoices &&
    selectedFiles.transactions &&
    !loadingStates.reconciliation;

  const handleNewReconciliation = () => {
    setShowNewReconciliationConfirm(true);
  };

  const confirmNewReconciliation = () => {
    setReconciliationResult(null);
    setShowNewReconciliationConfirm(false);
    setErrors({ invoices: "", transactions: "", reconciliation: "" });
  };

  const cancelNewReconciliation = () => {
    setShowNewReconciliationConfirm(false);
  };

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
      {!hasActiveReconciliation && !reconciliationResult && (
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
        hasActiveReconciliation) &&
        !reconciliationResult && (
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
      {reconciliationResult && !hasActiveReconciliation && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Nouvelle Réconciliation
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Lancer une nouvelle réconciliation avec de nouveaux fichiers
              </p>
            </div>
            <button
              onClick={handleNewReconciliation}
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Nouvelle réconciliation
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {showNewReconciliationConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <RefreshCw className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Nouvelle réconciliation
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir lancer une nouvelle réconciliation ?
                  Cela supprimera les résultats actuels et vous devrez
                  sélectionner de nouveaux fichiers.
                </p>
              </div>
              <div className="flex gap-4 px-4 py-3">
                <button
                  onClick={cancelNewReconciliation}
                  className="cursor-pointer flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmNewReconciliation}
                  className="cursor-pointer flex-1 px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Résultats */}
      {reconciliationResult && (
        <ReconciliationResults result={reconciliationResult} />
      )}
    </div>
  );
}
