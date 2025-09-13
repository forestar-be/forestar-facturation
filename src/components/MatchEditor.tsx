"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ConfirmationModal from "./ConfirmationModal";
import {
  DetailedReconciliationMatch,
  DetailedBankTransaction,
  DetailedInvoice,
  MatchSuggestion,
} from "@/types";
import {
  updateMatch,
  deleteMatch,
  getMatchSuggestions,
  createMatch,
  validateMatch,
  rejectMatch,
} from "@/lib/api";
import {
  X,
  Check,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronDown,
} from "lucide-react";
import { TransactionDetailsButton } from "./TransactionDetailsModal";
import { VirtualizedTransactionList } from "./VirtualizedTransactionList";
import { useTransactionSearch } from "@/hooks/useDebounce";
import {
  getMatchTypeColor,
  getMatchTypeLabel,
  getMatchTypeOnly,
  getValidationStatusLabel,
  getValidationStatusColor,
  getMatchTypeOnlyColor,
  getValidationStatusChipColor,
} from "@/lib/reconciliationUtils";

interface MatchEditorProps {
  match: DetailedReconciliationMatch;
  reconciliationId: string;
  unmatchedTransactions: DetailedBankTransaction[];
  allInvoices: DetailedInvoice[];
  allTransactions: DetailedBankTransaction[];
  onMatchUpdated: (updatedMatch: DetailedReconciliationMatch) => void;
  onMatchDeleted: (matchId: string) => void;
  onMatchValidated?: (updatedMatch: DetailedReconciliationMatch) => void;
  onMatchRejected?: (updatedMatch: DetailedReconciliationMatch) => void;
  onClose: () => void;
  initialEditingMode?: boolean;
}

export default function MatchEditor({
  match,
  reconciliationId,
  unmatchedTransactions,
  allInvoices,
  allTransactions: reconciliationTransactions,
  onMatchUpdated,
  onMatchDeleted,
  onMatchValidated,
  onMatchRejected,
  onClose,
  initialEditingMode = false,
}: MatchEditorProps) {
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

  const [isEditing, setIsEditing] = useState(initialEditingMode);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>(
    match.transactionId || ""
  );
  const [notes, setNotes] = useState<string>(match.notes.join("\n"));
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [showTransactionDropdown, setShowTransactionDropdown] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  // Optimisation: utiliser le hook de recherche debouncée
  const { debouncedSearch, isSearching } =
    useTransactionSearch(transactionSearch);

  // Charger les suggestions dès l'ouverture pour les correspondances manuelles, ou quand on passe en mode édition
  useEffect(() => {
    if (
      match.isManualMatch ||
      match.validationStatus === "REJECTED" ||
      isEditing
    ) {
      loadSuggestions();
    }
  }, [isEditing, match.isManualMatch, match.validationStatus]);

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

  // Fonction pour détecter si il y a des modifications
  const hasChanges = useMemo(() => {
    const originalTransactionId = match.transactionId || "";
    const originalNotes = match.notes.join("\n");

    return (
      selectedTransactionId !== originalTransactionId || notes !== originalNotes
    );
  }, [selectedTransactionId, notes, match.transactionId, match.notes]);

  // Gérer la fermeture avec confirmation si nécessaire
  const handleClose = () => {
    if (isEditing && hasChanges) {
      setShowConfirmationModal(true);
      setPendingClose(true);
    } else {
      onClose();
    }
  };

  // Confirmer l'abandon des modifications
  const handleConfirmClose = () => {
    setShowConfirmationModal(false);
    setPendingClose(false);
    onClose();
  };

  // Annuler la fermeture
  const handleCancelClose = () => {
    setShowConfirmationModal(false);
    setPendingClose(false);
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const suggestionsList = await getMatchSuggestions(
        reconciliationId,
        match.invoiceId
      );
      setSuggestions(suggestionsList);
    } catch (error) {
      console.error("Erreur lors du chargement des suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");

      // Vérifier si la transaction sélectionnée correspond à la suggestion automatique du système
      // Pour les correspondances "NONE", il n'y a pas eu de suggestion automatique d'origine,
      // donc même si on choisit la première suggestion, cela reste un choix manuel
      // EXCEPTION: si matchType est "NONE" et qu'on sélectionne "aucune transaction",
      // alors on confirme la décision automatique du système
      const isAutomaticSuggestion =
        (match.matchType !== "NONE" &&
          suggestions.length > 0 &&
          selectedTransactionId === suggestions[0].transaction.id) ||
        (match.matchType === "NONE" && !selectedTransactionId);

      const updateData = {
        transactionId: selectedTransactionId || undefined,
        notes: notes.split("\n").filter((note) => note.trim()),
        isManualMatch: !isAutomaticSuggestion,
      };

      const updatedMatch = await updateMatch(
        reconciliationId,
        match.id,
        updateData
      );

      if (updatedMatch) {
        onMatchUpdated(updatedMatch);
        setIsEditing(false);
      } else {
        setError("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      setError("Erreur lors de la sauvegarde");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette correspondance ?")) {
      return;
    }

    try {
      setLoading(true);
      const success = await deleteMatch(reconciliationId, match.id);

      if (success) {
        onMatchDeleted(match.id);
        onClose();
      } else {
        setError("Erreur lors de la suppression");
      }
    } catch (error) {
      setError("Erreur lors de la suppression");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      setLoading(true);
      setError("");

      const updatedMatch = await validateMatch(reconciliationId, match.id, [
        "Correspondance validée par l'utilisateur",
      ]);

      if (updatedMatch) {
        onMatchUpdated(updatedMatch);
        if (onMatchValidated) {
          onMatchValidated(updatedMatch);
        }
        onClose();
      } else {
        setError("Erreur lors de la validation");
      }
    } catch (error) {
      setError("Erreur lors de la validation");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Êtes-vous sûr de vouloir rejeter cette correspondance ?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const updatedMatch = await rejectMatch(reconciliationId, match.id, [
        "Correspondance rejetée par l'utilisateur",
      ]);

      if (updatedMatch) {
        onMatchUpdated(updatedMatch);
        if (onMatchRejected) {
          onMatchRejected(updatedMatch);
        }
        onClose();
      } else {
        setError("Erreur lors du rejet");
      }
    } catch (error) {
      setError("Erreur lors du rejet");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowConfirmationModal(true);
      setPendingClose(false); // On ne ferme pas, juste on annule l'édition
    } else {
      // Pas de modifications, on peut annuler directement
      setSelectedTransactionId(match.transactionId || "");
      setNotes(match.notes.join("\n"));
      setError("");
      setIsEditing(false);
    }
  };

  // Confirmer l'abandon des modifications en mode édition
  const handleConfirmCancel = () => {
    setSelectedTransactionId(match.transactionId || "");
    setNotes(match.notes.join("\n"));
    setError("");
    setIsEditing(false);
    setShowConfirmationModal(false);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Optimisation: mettre allTransactions dans useMemo pour éviter les recalculs
  const allTransactions = useMemo(() => {
    const currentTransaction = match.transactionId
      ? getTransactionFromMatch(match)
      : undefined;

    return [
      ...unmatchedTransactions,
      ...(currentTransaction ? [currentTransaction] : []),
    ];
  }, [unmatchedTransactions, match.transactionId, reconciliationTransactions]);

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

  // Optimisation: useCallback pour éviter les re-renders inutiles
  const handleTransactionSelect = useCallback((transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setShowTransactionDropdown(false);
    setTransactionSearch("");
  }, []);

  const handleDropdownToggle = useCallback(() => {
    setShowTransactionDropdown((prev) => !prev);
  }, []);

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header sticky */}
        <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            Éditer la correspondance
          </h2>
          <button
            onClick={handleClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Informations sur la facture */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Facture</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const invoice = getInvoiceFromMatch(match);
                return (
                  <>
                    <div>
                      <span className="text-sm font-medium text-blue-700">
                        Référence:
                      </span>
                      <p className="text-blue-900">{invoice?.ref || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700">
                        Tiers:
                      </span>
                      <p className="text-blue-900">{invoice?.tiers || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700">
                        Date:
                      </span>
                      <p className="text-blue-900">
                        {invoice?.dateFacturation || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700">
                        Montant TTC:
                      </span>
                      <p className="text-blue-900">
                        {invoice ? formatAmount(invoice.montantTTC) : "N/A"}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* État actuel de la correspondance */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">
                  État actuel
                </h3>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchTypeOnlyColor(
                      match.matchType,
                      match.isManualMatch
                    )}`}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {getMatchTypeOnly(match.matchType, match.isManualMatch)}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getValidationStatusChipColor(
                      match.validationStatus
                    )}`}
                  >
                    {getValidationStatusLabel(match.validationStatus)}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 mr-2">
                  Confiance
                </span>
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className={`h-2 rounded-full ${
                      match.isManualMatch
                        ? "bg-purple-500"
                        : match.validationStatus === "VALIDATED"
                          ? "bg-emerald-500"
                          : match.validationStatus === "REJECTED"
                            ? "bg-rose-500"
                            : match.confidence >= 80
                              ? "bg-green-500"
                              : match.confidence >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                    }`}
                    style={{
                      width: `${
                        match.isManualMatch
                          ? 100
                          : match.validationStatus === "VALIDATED"
                            ? 100
                            : match.validationStatus === "REJECTED"
                              ? 0
                              : match.confidence
                      }%`,
                    }}
                  ></div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    match.isManualMatch
                      ? "text-purple-600"
                      : match.validationStatus === "VALIDATED"
                        ? "text-emerald-600"
                        : match.validationStatus === "REJECTED"
                          ? "text-rose-600"
                          : "text-gray-600"
                  }`}
                >
                  {match.isManualMatch
                    ? "100%"
                    : match.validationStatus === "VALIDATED"
                      ? "100%"
                      : match.validationStatus === "REJECTED"
                        ? "0%"
                        : `${match.confidence.toFixed(0)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Sélection de transaction */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                Transaction associée
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-1" />
                {isEditing ? "Annuler" : "Modifier"}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choisir une transaction
                  </label>
                  <div className="relative transaction-dropdown">
                    <div
                      className="cursor-pointer block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      onClick={handleDropdownToggle}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {selectedTransaction ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 flex items-start">
                                <span className="flex-1 pr-2 line-clamp-3">
                                  {selectedTransaction.libelles ||
                                    "Libellé N/A"}
                                </span>
                                <TransactionDetailsButton
                                  transaction={selectedTransaction}
                                  className="flex-shrink-0 mt-0.5"
                                  size="sm"
                                />
                              </div>
                              <div className="text-gray-500">
                                {formatAmount(selectedTransaction.montant)} -{" "}
                                {selectedTransaction.dateComptable ||
                                  "Date N/A"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">
                              Aucune transaction sélectionnée
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

                {/* Suggestion automatique prioritaire pour correspondances manuelles */}
                {(match.isManualMatch ||
                  match.validationStatus === "REJECTED") &&
                  match.matchType !== "NONE" &&
                  suggestions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Suggestion automatique du système
                      </label>
                      <div className="border-2 border-blue-200 rounded-lg p-3 bg-blue-50">
                        <div
                          className="cursor-pointer hover:bg-blue-50 rounded p-2 -m-2"
                          onClick={() =>
                            setSelectedTransactionId(
                              suggestions[0].transaction.id
                            )
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 flex items-start">
                                <span className="flex-1 pr-2 line-clamp-3">
                                  {suggestions[0].transaction.libelles || "N/A"}
                                </span>
                                <TransactionDetailsButton
                                  transaction={suggestions[0].transaction}
                                  className="flex-shrink-0 mt-0.5"
                                  size="sm"
                                />
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatAmount(
                                  suggestions[0].transaction.montant
                                )}{" "}
                                - {suggestions[0].transaction.dateComptable}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(
                                  suggestions[0].matchType
                                )}`}
                              >
                                Confiance {suggestions[0].confidence.toFixed(0)}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-blue-100">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTransactionId(
                                suggestions[0].transaction.id
                              )
                            }
                            className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            → Sélectionner cette suggestion
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Autres suggestions */}
                {suggestions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {match.matchType === "NONE"
                        ? "Suggestions"
                        : match.isManualMatch
                          ? "Autres suggestions"
                          : "Suggestions"}{" "}
                      (
                      {match.matchType === "NONE"
                        ? suggestions.length
                        : suggestions.length - (match.isManualMatch ? 1 : 0)}
                      )
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {suggestions
                        .slice(
                          match.matchType === "NONE"
                            ? 0
                            : match.isManualMatch
                              ? 1
                              : 0
                        )
                        .map((suggestion, index) => (
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
                                <p className="text-sm font-medium text-gray-900 flex items-start">
                                  <span className="flex-1 pr-2 line-clamp-3">
                                    {suggestion.transaction.libelles || "N/A"}
                                  </span>
                                  <TransactionDetailsButton
                                    transaction={suggestion.transaction}
                                    className="flex-shrink-0 mt-0.5"
                                    size="sm"
                                  />
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
                                  Confiance {suggestion.confidence.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (une par ligne)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ajouter des notes explicatives..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const transaction = getTransactionFromMatch(match);
                  return transaction ? (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-green-700">
                            Libellé:
                          </span>
                          <p className="text-green-900 flex items-start">
                            <span className="flex-1 pr-2 line-clamp-3">
                              {transaction.libelles || "N/A"}
                            </span>
                            <TransactionDetailsButton
                              transaction={transaction}
                              className="flex-shrink-0 mt-0.5"
                              size="sm"
                            />
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 flex-shrink-0">
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-green-700">
                              Montant:
                            </span>
                            <p className="text-green-900 whitespace-nowrap">
                              {formatAmount(transaction.montant)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-green-700">
                              Date:
                            </span>
                            <p className="text-green-900 whitespace-nowrap">
                              {transaction.dateComptable || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`rounded-lg p-4 ${
                        match.validationStatus === "REJECTED"
                          ? "bg-rose-50"
                          : "bg-red-50"
                      }`}
                    >
                      <p
                        className={`${
                          match.validationStatus === "REJECTED"
                            ? "text-rose-800"
                            : "text-red-800"
                        }`}
                      >
                        {match.validationStatus === "REJECTED"
                          ? "Association supprimée (correspondance rejetée)"
                          : "Aucune transaction associée"}
                      </p>
                    </div>
                  );
                })()}

                {/* Affichage de la suggestion automatique si correspondance manuelle et qu'il y a des suggestions */}
                {(match.isManualMatch ||
                  match.validationStatus === "REJECTED") &&
                  match.matchType !== "NONE" &&
                  suggestions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <span className="text-xs font-medium text-blue-700">
                          Suggestion automatique du système :
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-start flex-1 mr-2">
                            <span className="flex-1 pr-2 line-clamp-2">
                              {suggestions[0].transaction.libelles || "N/A"} -{" "}
                              {formatAmount(suggestions[0].transaction.montant)}
                            </span>
                            <TransactionDetailsButton
                              transaction={suggestions[0].transaction}
                              className="flex-shrink-0 mt-0.5"
                              size="sm"
                            />
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getMatchTypeColor(
                              suggestions[0].matchType
                            )}`}
                          >
                            Confiance {suggestions[0].confidence.toFixed(0)}%
                          </span>
                        </div>
                        {suggestions[0].transaction.dateComptable && (
                          <div className="text-blue-500">
                            {suggestions[0].transaction.dateComptable}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Notes actuelles */}
          {match.notes.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                {match.notes.map((note, index) => (
                  <p key={index} className="text-sm text-gray-700 mb-1">
                    • {note}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer sticky */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </button>

          <div className="flex space-x-3">
            {/* Boutons Valider/Rejeter - toujours affichés */}
            <>
              <button
                onClick={handleReject}
                disabled={loading}
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-rose-300 text-sm font-medium rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
              >
                <X className="h-4 w-4 mr-2" />
                Rejeter
              </button>
              <button
                onClick={handleValidate}
                disabled={loading}
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-emerald-300 text-sm font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <Check className="h-4 w-4 mr-2" />
                Valider
              </button>
            </>

            {isEditing && (
              <>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="cursor-pointer px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation pour abandon des modifications */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onConfirm={pendingClose ? handleConfirmClose : handleConfirmCancel}
        onCancel={pendingClose ? handleCancelClose : handleCancelClose}
        title="Modifications non sauvegardées"
        message={
          pendingClose
            ? "Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer sans sauvegarder ?"
            : "Vous avez des modifications non sauvegardées. Voulez-vous vraiment annuler ces modifications ?"
        }
        confirmText={
          pendingClose
            ? "Fermer sans sauvegarder"
            : "Abandonner les modifications"
        }
        cancelText="Continuer l'édition"
        type="warning"
      />
    </div>
  );
}
