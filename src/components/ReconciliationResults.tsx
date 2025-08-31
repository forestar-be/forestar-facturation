"use client";

import { ReconciliationResult, ReconciliationMatch } from "@/types";
import { downloadReconciliationFile } from "@/lib/api";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  TrendingUp,
  BarChart2,
  Eye,
} from "lucide-react";
import { useState } from "react";

interface ReconciliationResultsProps {
  result: ReconciliationResult;
}

export default function ReconciliationResults({
  result,
}: ReconciliationResultsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMatch, setSelectedMatch] =
    useState<ReconciliationMatch | null>(null);

  const handleExport = async () => {
    if (result.downloadUrl && result.fileName) {
      const downloadResult = await downloadReconciliationFile(
        result.downloadUrl,
        result.fileName
      );
      if (!downloadResult.success) {
        alert("Erreur lors du téléchargement: " + downloadResult.message);
      }
    }
  };

  // Utiliser summary s'il existe, sinon statistics (rétrocompatibilité)
  const stats = result.summary || result.statistics;

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">
          Aucune donnée de réconciliation disponible
        </p>
      </div>
    );
  }

  const getMatchIcon = (match: ReconciliationMatch) => {
    switch (match.matchType) {
      case "EXACT_REF":
      case "EXACT_AMOUNT":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "FUZZY_NAME":
      case "COMBINED":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "NONE":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case "EXACT_REF":
        return "Référence exacte";
      case "EXACT_AMOUNT":
        return "Montant exact";
      case "FUZZY_NAME":
        return "Nom approximatif";
      case "COMBINED":
        return "Combiné (nom + montant)";
      case "NONE":
        return "Aucune correspondance";
      default:
        return "Inconnu";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart2 className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Résultats de la Réconciliation
            </h2>
          </div>
          <button
            onClick={handleExport}
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger le résultat Excel
          </button>
        </div>

        {/* Grille des statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">
                  Total Factures
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalInvoices}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">
                  Correspondances Exactes
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.exactMatches}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">
                  Correspondances Floues
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {stats.fuzzyMatches}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">
                  Non Appariées
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.noMatches}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Montants */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600">
              Montant Total Apparié
            </p>
            <p className="text-xl font-bold text-gray-900">
              {stats.totalMatchedAmount.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600">
              Montant Non Apparié
            </p>
            <p className="text-xl font-bold text-gray-900">
              {stats.totalUnmatchedAmount.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          </div>
          {result.summary?.reconciliationRate !== undefined && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-600">
                Taux de Réconciliation
              </p>
              <p className="text-xl font-bold text-blue-900">
                {result.summary.reconciliationRate}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bouton pour afficher les détails */}
      {result.matches && result.matches.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Eye className="h-5 w-5 mr-2" />
            {showDetails ? "Masquer les détails" : "Voir les détails"}
          </button>
        </div>
      )}

      {/* Tableau des résultats détaillés */}
      {showDetails && result.matches && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Détail des Correspondances
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correspondance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confiance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.matches.map((match, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {match.invoice.ref || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {match.invoice.tiers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {match.invoice.montantTTC.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getMatchIcon(match)}
                        <span className="ml-2 text-sm text-gray-900">
                          {getMatchTypeLabel(match.matchType)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${getConfidenceColor(match.confidence)}`}
                      >
                        {match.confidence}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {match.bankTransaction ? (
                        <div className="max-w-xs truncate">
                          <div className="font-medium">
                            {match.bankTransaction.montant.toLocaleString(
                              "fr-FR",
                              {
                                style: "currency",
                                currency: "EUR",
                              }
                            )}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {match.bankTransaction.dateComptable}
                          </div>
                          <div className="text-gray-500 text-xs truncate">
                            {match.bankTransaction.libelles}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          Aucune transaction
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions non appariées */}
      {result.unmatchedTransactions &&
        result.unmatchedTransactions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Transactions Bancaires Non Appariées (
              {result.unmatchedTransactions?.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Libellé
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.unmatchedTransactions
                    ?.slice(0, 10)
                    .map((transaction, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.dateComptable}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.montant.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.libelles}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {result.unmatchedTransactions &&
              result.unmatchedTransactions.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  ... et {result.unmatchedTransactions.length - 10} autres
                  transactions
                </p>
              )}
          </div>
        )}
    </div>
  );
}
