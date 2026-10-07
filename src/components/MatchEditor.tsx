"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Combobox,
  ConfirmDialog,
  DataList,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Progress,
  Spinner,
  StatusBadge,
  Textarea,
} from "@forestar-be/ui";
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
  validateMatch,
  rejectMatch,
} from "@/lib/api";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { formatAmount } from "@/lib/format";
import {
  getConfidenceDisplay,
  getMatchTypeOnly,
  getMatchTypeTone,
  getValidationStatusLabel,
  getValidationStatusTone,
} from "@/lib/reconciliationUtils";
import { TransactionDetailsButton } from "./TransactionDetailsModal";
import SuggestionRow from "./SuggestionRow";
import {
  MAX_TRANSACTION_OPTIONS,
  useTransactionOptions,
} from "./transaction-options";

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

/** Confirmation en attente : une seule fenêtre à la fois. */
type PendingConfirmation = "close" | "cancel" | "delete" | "reject" | null;

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
  const [pending, setPending] = useState<PendingConfirmation>(null);

  // Charger les suggestions dès l'ouverture pour les correspondances manuelles, ou quand on passe en mode édition
  useEffect(() => {
    if (
      !match.isManualMatch &&
      match.validationStatus !== "REJECTED" &&
      !isEditing
    ) {
      return;
    }

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
    loadSuggestions();
  }, [
    isEditing,
    match.isManualMatch,
    match.validationStatus,
    match.invoiceId,
    reconciliationId,
  ]);

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
      setPending("close");
    } else {
      onClose();
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
    setPending(null);

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
    setPending(null);

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
      setPending("cancel");
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
    setPending(null);
  };

  const allTransactions = useMemo(() => {
    const currentTransaction = match.transactionId
      ? reconciliationTransactions.find((t) => t.id === match.transactionId)
      : undefined;

    return [
      ...unmatchedTransactions,
      ...(currentTransaction ? [currentTransaction] : []),
    ];
  }, [unmatchedTransactions, match.transactionId, reconciliationTransactions]);

  const transactionOptions = useTransactionOptions(allTransactions);

  // Trouver la transaction sélectionnée pour l'affichage
  const selectedTransaction = useMemo(
    () => allTransactions.find((t) => t.id === selectedTransactionId),
    [allTransactions, selectedTransactionId]
  );

  const invoice = getInvoiceFromMatch(match);
  const transaction = getTransactionFromMatch(match);
  const confidence = getConfidenceDisplay(match, true);
  // Suggestion automatique du système, mise en avant pour une correspondance
  // manuelle ou rejetée.
  const showSystemSuggestion =
    (match.isManualMatch || match.validationStatus === "REJECTED") &&
    match.matchType !== "NONE" &&
    suggestions.length > 0;

  const confirmation = {
    close: {
      title: "Modifications non sauvegardées",
      message:
        "Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer sans sauvegarder ?",
      confirmText: "Fermer sans sauvegarder",
      type: "warning" as const,
      onConfirm: () => {
        setPending(null);
        onClose();
      },
    },
    cancel: {
      title: "Modifications non sauvegardées",
      message:
        "Vous avez des modifications non sauvegardées. Voulez-vous vraiment annuler ces modifications ?",
      confirmText: "Abandonner les modifications",
      type: "warning" as const,
      onConfirm: handleConfirmCancel,
    },
    delete: {
      title: "Supprimer la correspondance",
      message: "Êtes-vous sûr de vouloir supprimer cette correspondance ?",
      confirmText: "Supprimer",
      type: "delete" as const,
      onConfirm: handleDelete,
    },
    reject: {
      title: "Rejeter la correspondance",
      message: "Êtes-vous sûr de vouloir rejeter cette correspondance ?",
      confirmText: "Rejeter",
      type: "delete" as const,
      onConfirm: handleReject,
    },
  };
  const current = pending ? confirmation[pending] : null;

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-[min(92vw,56rem)]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Éditer la correspondance
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              >
                <AlertCircle className="size-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Informations sur la facture */}
            <section className="rounded-lg bg-info/10 p-4">
              <h3 className="mb-3 text-lg font-medium">Facture</h3>
              <DataList
                columns={3}
                items={[
                  { label: "Référence", value: invoice?.ref || "N/A" },
                  { label: "Tiers", value: invoice?.tiers || "N/A" },
                  { label: "Date", value: invoice?.dateFacturation || "N/A" },
                  {
                    label: "Montant TTC",
                    value: invoice ? formatAmount(invoice.montantTTC) : "N/A",
                  },
                ]}
              />
            </section>

            {/* État actuel de la correspondance */}
            <section className="rounded-lg bg-muted/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-medium">État actuel</h3>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      tone={getMatchTypeTone(
                        match.matchType,
                        match.isManualMatch
                      )}
                    >
                      <CheckCircle2 />
                      {getMatchTypeOnly(match.matchType, match.isManualMatch)}
                    </StatusBadge>
                    <StatusBadge
                      tone={getValidationStatusTone(match.validationStatus)}
                    >
                      {getValidationStatusLabel(match.validationStatus)}
                    </StatusBadge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Confiance
                  </span>
                  <Progress
                    value={confidence.percent}
                    tone={confidence.tone}
                    aria-label="Confiance"
                    className="w-16"
                  />
                  <span className="text-sm font-medium">
                    {confidence.label}
                  </span>
                </div>
              </div>
            </section>

            {/* Sélection de transaction */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-medium">Transaction associée</h3>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Pencil />
                  {isEditing ? "Annuler" : "Modifier"}
                </Button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
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
                        placeholder="Aucune transaction sélectionnée"
                        searchPlaceholder="Rechercher une transaction..."
                        emptyMessage="Aucune transaction trouvée"
                      />
                    )}
                  </FormField>
                  {selectedTransaction && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-3 font-medium">
                          {selectedTransaction.libelles || "Libellé N/A"}
                        </div>
                        <div className="text-muted-foreground">
                          {formatAmount(selectedTransaction.montant)} -{" "}
                          {selectedTransaction.dateComptable || "Date N/A"}
                        </div>
                      </div>
                      <TransactionDetailsButton
                        transaction={selectedTransaction}
                      />
                    </div>
                  )}

                  {/* Suggestion automatique prioritaire pour correspondances manuelles */}
                  {showSystemSuggestion && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        Suggestion automatique du système
                      </span>
                      <SuggestionRow
                        highlighted
                        suggestion={suggestions[0]}
                        onSelect={() =>
                          setSelectedTransactionId(
                            suggestions[0].transaction.id
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTransactionId(
                            suggestions[0].transaction.id
                          )
                        }
                        className="cursor-pointer text-xs font-medium text-primary hover:underline"
                      >
                        → Sélectionner cette suggestion
                      </button>
                    </div>
                  )}

                  {/* Autres suggestions */}
                  {suggestions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">
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
                      </span>
                      <div className="max-h-48 space-y-2 overflow-y-auto">
                        {suggestions
                          .slice(
                            match.matchType === "NONE"
                              ? 0
                              : match.isManualMatch
                                ? 1
                                : 0
                          )
                          .map((suggestion, index) => (
                            <SuggestionRow
                              key={index}
                              suggestion={suggestion}
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

                  {/* Notes */}
                  <FormField label="Notes (une par ligne)">
                    {(field) => (
                      <Textarea
                        {...field}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Ajouter des notes explicatives..."
                      />
                    )}
                  </FormField>
                </div>
              ) : (
                <div className="space-y-3">
                  {transaction ? (
                    <div className="rounded-lg bg-success/10 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            Libellé:
                          </span>
                          <div className="flex items-start">
                            <span className="line-clamp-3 flex-1 pr-2">
                              {transaction.libelles || "N/A"}
                            </span>
                            <TransactionDetailsButton
                              transaction={transaction}
                            />
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-4 sm:flex-row md:gap-6">
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Montant:
                            </span>
                            <p className="whitespace-nowrap">
                              {formatAmount(transaction.montant)}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Date:
                            </span>
                            <p className="whitespace-nowrap">
                              {transaction.dateComptable || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                      <p>
                        {match.validationStatus === "REJECTED"
                          ? "Association supprimée (correspondance rejetée)"
                          : "Aucune transaction associée"}
                      </p>
                    </div>
                  )}

                  {/* Affichage de la suggestion automatique si correspondance manuelle et qu'il y a des suggestions */}
                  {showSystemSuggestion && (
                    <div className="rounded-lg border border-info/25 bg-info/10 p-3">
                      <span className="text-xs font-medium text-info">
                        Suggestion automatique du système :
                      </span>
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 flex-1 items-start">
                            <span className="line-clamp-2 flex-1 pr-2">
                              {suggestions[0].transaction.libelles || "N/A"} -{" "}
                              {formatAmount(suggestions[0].transaction.montant)}
                            </span>
                            <TransactionDetailsButton
                              transaction={suggestions[0].transaction}
                            />
                          </span>
                          <StatusBadge
                            tone={getMatchTypeTone(suggestions[0].matchType)}
                          >
                            Confiance {suggestions[0].confidence.toFixed(0)}%
                          </StatusBadge>
                        </div>
                        {suggestions[0].transaction.dateComptable && (
                          <div className="text-muted-foreground">
                            {suggestions[0].transaction.dateComptable}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Notes actuelles */}
            {match.notes.length > 0 && (
              <section>
                <h3 className="mb-2 text-lg font-medium">Notes</h3>
                <div className="rounded-lg bg-muted/50 p-3">
                  {match.notes.map((note, index) => (
                    <p key={index} className="mb-1 text-sm">
                      • {note}
                    </p>
                  ))}
                </div>
              </section>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => setPending("delete")}
              disabled={loading}
            >
              <Trash2 />
              Supprimer
            </Button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {/* Boutons Valider/Rejeter - toujours affichés */}
              <Button
                variant="destructive"
                onClick={() => setPending("reject")}
                disabled={loading}
              >
                <X />
                Rejeter
              </Button>
              <Button
                variant="outline"
                className="text-success"
                onClick={handleValidate}
                disabled={loading}
              >
                <Check />
                Valider
              </Button>

              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                      <Spinner size="sm" className="text-current" />
                    ) : (
                      <Check />
                    )}
                    Sauvegarder
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmations : abandon des modifications, suppression, rejet */}
      <ConfirmDialog
        open={current !== null}
        title={current?.title ?? ""}
        message={current?.message ?? ""}
        confirmText={current?.confirmText}
        cancelText={
          pending === "close" || pending === "cancel"
            ? "Continuer l'édition"
            : undefined
        }
        type={current?.type ?? "warning"}
        onConfirm={() => current?.onConfirm()}
        onClose={() => setPending(null)}
      />
    </>
  );
}
