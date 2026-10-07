"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Combobox,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Progress,
  StatusBadge,
} from "@forestar-be/ui";
import {
  DetailedReconciliationMatch,
  DetailedBankTransaction,
  DetailedInvoice,
  MatchSuggestion,
} from "@/types";
import { getMatchSuggestions } from "@/lib/api";
import { AlertTriangle, Check, Plus } from "lucide-react";
import { getMatchTypeLabel, getMatchTypeTone } from "@/lib/reconciliationUtils";
import SuggestionRow from "./SuggestionRow";
import {
  MAX_TRANSACTION_OPTIONS,
  useTransactionOptions,
} from "./transaction-options";

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
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

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

  // Charger les suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestionsList = await getMatchSuggestions(
          reconciliationId,
          invoiceId
        );
        setSuggestions(suggestionsList);
      } catch (error) {
        console.error("Erreur lors du chargement des suggestions:", error);
      }
    };
    loadSuggestions();
  }, [reconciliationId, invoiceId]);

  // Détecter s'il y a des modifications (si une sélection a été faite)
  const hasChanges =
    selectedMatchId !== null || (showCreateNew && selectedTransactionId !== "");

  // Gérer la fermeture avec confirmation si nécessaire
  const handleCancel = () => {
    if (hasChanges) {
      setShowConfirmationModal(true);
    } else {
      onCancel();
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

  const allTransactions = useMemo(() => {
    const matchTransactions = matches
      .filter((m) => m.transactionId)
      .map((m) =>
        reconciliationTransactions.find((t) => t.id === m.transactionId)
      )
      .filter((t): t is DetailedBankTransaction => t !== undefined);

    return [...unmatchedTransactions, ...matchTransactions];
  }, [unmatchedTransactions, matches, reconciliationTransactions]);

  const transactionOptions = useTransactionOptions(allTransactions);

  const invoice = matches[0] ? getInvoiceFromMatch(matches[0]) : undefined;

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => !open && !isResolving && handleCancel()}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[min(92vw,56rem)]"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="size-6 text-warning" />
              Correspondances multiples détectées
            </DialogTitle>
          </DialogHeader>

          <div className="min-w-0 space-y-6">
            <div>
              <h4 className="mb-2 font-medium">Facture :</h4>
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <div className="font-medium">{invoice?.ref || "N/A"}</div>
                <div className="text-muted-foreground">
                  {invoice?.tiers || "N/A"}
                </div>
                <div className="text-muted-foreground">
                  {invoice?.montantTTC.toFixed(2)} €
                </div>
                {invoice?.dateFacturation && (
                  <div className="text-xs text-muted-foreground">
                    {invoice.dateFacturation}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-medium">
                  Choisissez la correspondance à conserver :
                </h4>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateNew(!showCreateNew);
                    setSelectedMatchId(null);
                    setSelectedTransactionId("");
                  }}
                >
                  <Plus />
                  {showCreateNew
                    ? "Choisir parmi les correspondances automatiquement trouvées"
                    : "Créer une correspondance manuelle"}
                </Button>
              </div>

              {showCreateNew ? (
                <div className="space-y-4 rounded-lg border border-info/25 bg-info/10 p-4">
                  <h5 className="text-sm font-medium">
                    Créer un nouveau match avec une transaction différente
                  </h5>

                  <FormField label="Choisir une transaction">
                    {(field) => (
                      <Combobox
                        {...field}
                        options={transactionOptions.options}
                        renderOption={transactionOptions.render}
                        limit={MAX_TRANSACTION_OPTIONS}
                        value={selectedTransactionId || undefined}
                        onChange={(value) =>
                          setSelectedTransactionId(value ?? "")
                        }
                        placeholder="Sélectionner une transaction"
                        searchPlaceholder="Rechercher une transaction..."
                        emptyMessage="Aucune transaction trouvée"
                      />
                    )}
                  </FormField>

                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        Suggestions du système ({suggestions.length})
                      </span>
                      <div className="max-h-48 space-y-2 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <SuggestionRow
                            key={index}
                            suggestion={suggestion}
                            confidenceLabel={(confidence) => `${confidence}%`}
                            onSelect={() =>
                              setSelectedTransactionId(
                                suggestion.transaction.id
                              )
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="space-y-3"
                  role="radiogroup"
                  aria-label="Correspondances"
                >
                  {matches.map((match, index) => {
                    const transaction = getTransactionFromMatch(match);
                    const selected = selectedMatchId === match.id;
                    return (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        key={match.id}
                        className={`w-full cursor-pointer rounded-lg border p-4 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "hover:border-ring/50"
                        }`}
                        onClick={() => setSelectedMatchId(match.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">
                                Option {index + 1}
                              </span>
                              <StatusBadge
                                tone={
                                  match.isManualMatch
                                    ? "neutral"
                                    : match.validationStatus === "VALIDATED"
                                      ? "success"
                                      : match.validationStatus === "REJECTED"
                                        ? "danger"
                                        : getMatchTypeTone(match.matchType)
                                }
                              >
                                {getMatchTypeLabel(
                                  match.matchType,
                                  match.validationStatus,
                                  match.isManualMatch
                                )}
                              </StatusBadge>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={match.confidence}
                                  tone={
                                    match.confidence >= 80
                                      ? "success"
                                      : match.confidence >= 50
                                        ? "warning"
                                        : "danger"
                                  }
                                  aria-label="Confiance"
                                  className="w-20"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {match.confidence.toFixed(0)}%
                                </span>
                              </div>
                            </div>

                            {transaction ? (
                              <div className="text-sm">
                                <div className="mb-1 font-medium">
                                  {transaction.libelles || "N/A"}
                                </div>
                                <div className="mb-1 text-xs text-muted-foreground">
                                  {transaction.detailsMouvement || "N/A"}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>
                                    {transaction.montant.toFixed(2)} €
                                  </span>
                                  {transaction.dateComptable && (
                                    <span>{transaction.dateComptable}</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground italic">
                                Aucune transaction
                              </div>
                            )}

                            {match.notes && match.notes.length > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Notes: {match.notes.join(", ")}
                              </div>
                            )}
                          </div>

                          <div className="ml-4 size-5">
                            {selected && (
                              <Check className="size-5 text-primary" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isResolving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleResolve}
              disabled={
                (!selectedMatchId && !showCreateNew) ||
                (showCreateNew && !selectedTransactionId) ||
                isResolving
              }
            >
              {isResolving
                ? "Résolution..."
                : showCreateNew
                  ? "Créer le nouveau match"
                  : "Valider le choix"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation pour abandon des modifications */}
      <ConfirmDialog
        open={showConfirmationModal}
        title="Sélection en cours"
        message="Vous avez commencé à faire une sélection. Voulez-vous vraiment annuler sans résoudre les correspondances multiples ?"
        confirmText="Annuler la sélection"
        cancelText="Continuer la sélection"
        onConfirm={() => {
          setShowConfirmationModal(false);
          onCancel();
        }}
        onClose={() => setShowConfirmationModal(false)}
      />
    </>
  );
}
