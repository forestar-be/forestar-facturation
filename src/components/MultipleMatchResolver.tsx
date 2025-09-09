"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ConfirmationModal from "./ConfirmationModal";
import {
  DetailedReconciliationMatch,
  DetailedBankTransaction,
  DetailedInvoice,
  MatchSuggestion,
} from "@/types";
import { getMatchSuggestions } from "@/lib/api";
import {
  AlertTriangle,
  Check,
  X,
  Eye,
  Plus,
  Search,
  ChevronDown,
} from "lucide-react";
import {
  getMatchTypeColor,
  getMatchTypeLabel,
} from "@/lib/reconciliationUtils";
import { VirtualizedTransactionList } from "./VirtualizedTransactionList";
import { useTransactionSearch } from "@/hooks/useDebounce";

interface MultipleMatchResolverProps {
  invoiceId: string;
  matches: DetailedReconciliationMatch[];
  reconciliationId: string;
  unmatchedTransactions: DetailedBankTransaction[];
  allInvoices: DetailedInvoice[];
  allTransactions: DetailedBankTransaction[];
  onResolve: (
    selectedMatchId: string | null,
    rejectedMatchIds: string[],
    newTransactionId?: string
  ) => Promise<void>;
  onCancel: () => void;
}

export default function MultipleMatchResolver({
  invoiceId,
  matches,
  reconciliationId,
  unmatchedTransactions,
  allInvoices,
  allTransactions: reconciliationTransactions,
  onResolve,
  onCancel,
}: MultipleMatchResolverProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] =
    useState<string>("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [showTransactionDropdown, setShowTransactionDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Optimisation: utiliser le hook de recherche debouncée
  const { debouncedSearch, isSearching } =
    useTransactionSearch(transactionSearch);

  // Helper functions to get invoice and transaction details from matches
  const getInvoiceFromMatch = (match: DetailedReconciliationMatch) => {
    return allInvoices.find((inv) => inv.id === match.invoiceId);
  };

  const getTransactionFromMatch = (match: DetailedReconciliationMatch) => {
    return match.transactionId
      ? reconciliationTransactions.find(
          (trans) => trans.id === match.transactionId
        )
      : undefined;
  };
  const [loading, setLoading] = useState(false);

  // Charger les suggestions
  useEffect(() => {
    loadSuggestions();
  }, []);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showTransactionDropdown &&
        !(event.target as Element).closest(".transaction-dropdown")
      ) {
        setShowTransactionDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTransactionDropdown]);

  // Détecter s'il y a des modifications (si une sélection a été faite)
  const hasChanges = useMemo(() => {
    return (
      selectedMatchId !== null ||
      (showCreateNew && selectedTransactionId !== "")
    );
  }, [selectedMatchId, showCreateNew, selectedTransactionId]);

  // Gérer la fermeture avec confirmation si nécessaire
  const handleCancel = () => {
    if (hasChanges) {
      setShowConfirmationModal(true);
    } else {
      onCancel();
    }
  };

  // Confirmer l'abandon des modifications
  const handleConfirmCancel = () => {
    setShowConfirmationModal(false);
    onCancel();
  };

  // Annuler la fermeture
  const handleCancelClose = () => {
    setShowConfirmationModal(false);
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const suggestionsList = await getMatchSuggestions(
        reconciliationId,
        invoiceId
      );
      setSuggestions(suggestionsList);
    } catch (error) {
      console.error("Erreur lors du chargement des suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (showCreateNew && !selectedTransactionId) {
      return; // Mode création d'un nouveau match sans transaction sélectionnée
    }

    if (!showCreateNew && !selectedMatchId) {
      return; // Mode sélection d'un match existant sans match sélectionné
    }

    const rejectedMatchIds = matches.map((match) => match.id);

    setIsResolving(true);
    try {
      if (showCreateNew) {
        // Créer un nouveau match avec la transaction sélectionnée
        await onResolve(
          null,
          rejectedMatchIds,
          selectedTransactionId || undefined
        );
      } else {
        // Garder le match sélectionné, rejeter les autres
        const filteredRejectedIds = rejectedMatchIds.filter(
          (id) => id !== selectedMatchId
        );
        await onResolve(selectedMatchId, filteredRejectedIds);
      }
    } finally {
      setIsResolving(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Optimisation: mettre allTransactions dans useMemo
  const allTransactions = useMemo(() => {
    const matchTransactions = matches
      .filter((m) => m.transactionId)
      .map((m) => getTransactionFromMatch(m))
      .filter((t): t is DetailedBankTransaction => t !== undefined);

    return [...unmatchedTransactions, ...matchTransactions];
  }, [unmatchedTransactions, matches, reconciliationTransactions]);

  // Filtrer les transactions selon la recherche (avec debounce)
  const filteredTransactions = useMemo(() => {
    if (!debouncedSearch) return allTransactions;

    const searchTerm = debouncedSearch.toLowerCase();
    return allTransactions.filter((transaction) => {
      // Optimisation: vérifier les champs les plus probables en premier
      const libelles = transaction.libelles?.toLowerCase();
      if (libelles?.includes(searchTerm)) return true;

      const details = transaction.detailsMouvement?.toLowerCase();
      if (details?.includes(searchTerm)) return true;

      // Éviter toString() si ce n'est pas nécessaire
      if (
        searchTerm.match(/^\d/) &&
        transaction.montant.toString().includes(searchTerm)
      )
        return true;

      return transaction.dateComptable?.includes(searchTerm) || false;
    });
  }, [allTransactions, debouncedSearch]);

  // Trouver la transaction sélectionnée pour l'affichage
  const selectedTransaction = useMemo(
    () => allTransactions.find((t) => t.id === selectedTransactionId),
    [allTransactions, selectedTransactionId]
  );

  // Optimisation: useCallback pour les gestionnaires
  const handleTransactionSelect = useCallback((transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setShowTransactionDropdown(false);
    setTransactionSearch("");
  }, []);

  const handleDropdownToggle = useCallback(() => {
    setShowTransactionDropdown((prev) => !prev);
  }, []);

  const invoice = matches[0] ? getInvoiceFromMatch(matches[0]) : undefined;

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header sticky */}
        <div className="p-4 border-b bg-white rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Correspondances multiples détectées
            </h3>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-2">
              Facture :
            </h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm">
                <div className="font-medium">{invoice?.ref || "N/A"}</div>
                <div className="text-gray-600">{invoice?.tiers || "N/A"}</div>
                <div className="text-gray-600">
                  {invoice?.montantTTC.toFixed(2)} €
                </div>
                {invoice?.dateFacturation && (
                  <div className="text-gray-500 text-xs">
                    {invoice.dateFacturation}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">
                Choisissez la correspondance à conserver :
              </h4>
              <button
                onClick={() => {
                  setShowCreateNew(!showCreateNew);
                  setSelectedMatchId(null);
                  setSelectedTransactionId("");
                }}
                className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                {showCreateNew
                  ? "Choisir parmi les correspondances automatiquement trouvées"
                  : "Créer une correspondance manuelle"}
              </button>
            </div>

            {showCreateNew ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-blue-900 mb-3">
                    Créer un nouveau match avec une transaction différente
                  </h5>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choisir une transaction
                    </label>
                    <div className="relative transaction-dropdown">
                      <div
                        className="cursor-pointer block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                        onClick={() =>
                          setShowTransactionDropdown(!showTransactionDropdown)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {selectedTransaction ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {selectedTransaction.libelles ||
                                    "Libellé N/A"}
                                </div>
                                <div className="text-gray-500">
                                  {formatAmount(selectedTransaction.montant)} -{" "}
                                  {selectedTransaction.dateComptable ||
                                    "Date N/A"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">
                                Sélectionner une transaction
                              </span>
                            )}
                          </div>
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>

                      {showTransactionDropdown && (
                        <div className="absolute z-[60] mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                          <div className="p-3 border-b">
                            <div className="relative">
                              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Rechercher une transaction..."
                                value={transactionSearch}
                                onChange={(e) =>
                                  setTransactionSearch(e.target.value)
                                }
                                className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            <div
                              className="cursor-pointer px-3 py-2 hover:bg-gray-50 border-b"
                              onClick={() => handleTransactionSelect("")}
                            >
                              <span className="text-gray-500 text-sm">
                                Aucune transaction
                              </span>
                            </div>
                            <VirtualizedTransactionList
                              transactions={filteredTransactions}
                              selectedTransactionId={selectedTransactionId}
                              onTransactionSelect={handleTransactionSelect}
                              formatAmount={formatAmount}
                              maxVisibleItems={50}
                            />
                            {filteredTransactions.length === 0 &&
                              debouncedSearch && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Aucune transaction trouvée
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Suggestions du système ({suggestions.length})
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              setSelectedTransactionId(
                                suggestion.transaction.id
                              )
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {suggestion.transaction.libelles || "N/A"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatAmount(suggestion.transaction.montant)}{" "}
                                  - {suggestion.transaction.dateComptable}
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(
                                    suggestion.matchType
                                  )}`}
                                >
                                  {suggestion.confidence.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match, index) => (
                  <div
                    key={match.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedMatchId === match.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedMatchId(match.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-sm">
                            Option {index + 1}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchTypeColor(
                              match.matchType,
                              match.validationStatus,
                              match.isManualMatch
                            )}`}
                          >
                            {getMatchTypeLabel(
                              match.matchType,
                              match.validationStatus,
                              match.isManualMatch
                            )}
                          </span>
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  match.confidence >= 80
                                    ? "bg-green-500"
                                    : match.confidence >= 50
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${match.confidence}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {match.confidence.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {(() => {
                          const transaction = getTransactionFromMatch(match);
                          return transaction ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 mb-1">
                                {transaction.libelles || "N/A"}
                              </div>
                              <div className="text-gray-600 text-xs mb-1">
                                {transaction.detailsMouvement || "N/A"}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>{transaction.montant.toFixed(2)} €</span>
                                {transaction.dateComptable && (
                                  <span>{transaction.dateComptable}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 italic">
                              Aucune transaction
                            </div>
                          );
                        })()}

                        {match.notes && match.notes.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            Notes: {match.notes.join(", ")}
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        {selectedMatchId === match.id && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer sticky */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              disabled={isResolving}
              className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleResolve}
              disabled={
                (!selectedMatchId && !showCreateNew) ||
                (showCreateNew && !selectedTransactionId) ||
                isResolving
              }
              className="cursor-pointer px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isResolving
                ? "Résolution..."
                : showCreateNew
                  ? "Créer le nouveau match"
                  : "Valider le choix"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation pour abandon des modifications */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelClose}
        title="Sélection en cours"
        message="Vous avez commencé à faire une sélection. Voulez-vous vraiment annuler sans résoudre les correspondances multiples ?"
        confirmText="Annuler la sélection"
        cancelText="Continuer la sélection"
        type="warning"
      />
    </div>
  );
}
