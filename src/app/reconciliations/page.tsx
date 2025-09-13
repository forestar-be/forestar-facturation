"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import StatusIcon from "@/components/StatusIcon";
import { getAllReconciliations } from "@/lib/api";
import { deleteReconciliation } from "@/lib/api";
import { ReconciliationSummary } from "@/types";
import {
  formatDate,
  formatDuration,
  getReconciliationDisplayTitle,
} from "@/lib/reconciliationUtils";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";

const getStatusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Terminée";
    case "ERROR":
      return "Erreur";
    case "PROCESSING":
      return "En cours";
    case "PENDING":
      return "En attente";
    default:
      return "Inconnu";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "ERROR":
      return "bg-red-100 text-red-800";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ReconciliationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [reconciliations, setReconciliations] = useState<
    ReconciliationSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/connexion");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchReconciliations = async () => {
      try {
        setLoading(true);
        const data = await getAllReconciliations();
        setReconciliations(data);
      } catch (err) {
        setError("Erreur lors du chargement des réconciliations");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchReconciliations();
    }
  }, [isAuthenticated]);

  const handleDeleteReconciliation = async (reconciliationId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cette réconciliation ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      setDeletingId(reconciliationId);
      const success = await deleteReconciliation(reconciliationId);

      if (success) {
        // Retirer la réconciliation de la liste
        setReconciliations((prev) =>
          prev.filter((r) => r.id !== reconciliationId)
        );
      } else {
        setError("Erreur lors de la suppression de la réconciliation");
      }
    } catch (err) {
      setError("Erreur lors de la suppression de la réconciliation");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Historique des Réconciliations
              </h1>
              <p className="mt-2 text-gray-600">
                Consultez et gérez toutes vos réconciliations bancaires
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle réconciliation
            </button>
          </div>

          {/* Contenu */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          ) : reconciliations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucune réconciliation
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par créer votre première réconciliation bancaire.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push("/")}
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle réconciliation
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {reconciliations.map((reconciliation) => (
                  <li key={reconciliation.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <StatusIcon status={reconciliation.status} />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {getReconciliationDisplayTitle(
                                  reconciliation.title,
                                  reconciliation.createdAt
                                )}
                              </div>
                              <span
                                className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reconciliation.status)}`}
                              >
                                {getStatusLabel(reconciliation.status)}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <div className="flex items-center">
                                <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <span>{reconciliation.invoicesFileName}</span>
                              </div>
                              <span className="mx-2">•</span>
                              <div className="flex items-center">
                                <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <span>
                                  {reconciliation.transactionsFileName}
                                </span>
                              </div>
                              <span className="mx-2">•</span>
                              <div className="flex items-center">
                                <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <span>
                                  {formatDuration(
                                    reconciliation.startTime,
                                    reconciliation.endTime
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-8">
                          {/* Statistiques */}
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {reconciliation.totalInvoices} factures
                            </div>
                            <div className="text-sm text-gray-500">
                              {reconciliation.totalTransactions} transactions
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {reconciliation.exactMatches +
                                reconciliation.fuzzyMatches}{" "}
                              appariées
                            </div>
                            <div className="text-sm text-gray-500">
                              {reconciliation.reconciliationRate}% de réussite
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {reconciliation.totalMatchedAmount.toFixed(2)} €
                            </div>
                            <div className="text-sm text-gray-500">
                              montant apparié
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex space-x-2">
                            <button
                              onClick={() =>
                                router.push(
                                  `/reconciliations/${reconciliation.id}`
                                )
                              }
                              className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Voir
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteReconciliation(reconciliation.id)
                              }
                              disabled={deletingId === reconciliation.id}
                              className="cursor-pointer inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === reconciliation.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Message d'erreur */}
                      {reconciliation.status === "ERROR" &&
                        reconciliation.errorMessage && (
                          <div className="mt-3 ml-12 text-sm text-red-600 bg-red-50 p-2 rounded">
                            {reconciliation.errorMessage}
                          </div>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
