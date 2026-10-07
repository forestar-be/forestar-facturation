"use client";

import { useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import {
  Button,
  Combobox,
  DataList,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Spinner,
  Textarea,
} from "@forestar-be/ui";
import {
  DetailedInvoice,
  DetailedBankTransaction,
  DetailedReconciliationMatch,
} from "@/types";
import { createMatch } from "@/lib/api";
import { formatAmount } from "@/lib/format";
import {
  MAX_INVOICE_OPTIONS,
  MAX_TRANSACTION_OPTIONS,
  useInvoiceOptions,
  useTransactionOptions,
} from "./transaction-options";

interface CreateMatchModalProps {
  reconciliationId: string;
  unmatchedInvoices: DetailedInvoice[];
  unmatchedTransactions: DetailedBankTransaction[];
  onMatchCreated: (newMatch: DetailedReconciliationMatch) => void;
  onClose: () => void;
}

export default function CreateMatchModal({
  reconciliationId,
  unmatchedInvoices,
  unmatchedTransactions,
  onMatchCreated,
  onClose,
}: CreateMatchModalProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [selectedTransactionId, setSelectedTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const invoiceOptions = useInvoiceOptions(unmatchedInvoices);
  const transactionOptions = useTransactionOptions(unmatchedTransactions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoiceId) {
      setError("Veuillez sélectionner une facture");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const createData = {
        invoiceId: selectedInvoiceId,
        transactionId: selectedTransactionId || undefined,
        matchType: (selectedTransactionId ? "COMBINED" : "NONE") as
          | "COMBINED"
          | "NONE",
        notes: notes.split("\n").filter((note) => note.trim()),
      };

      const newMatch = await createMatch(reconciliationId, createData);

      if (newMatch) {
        onMatchCreated(newMatch);
        onClose();
      } else {
        setError("Erreur lors de la création de la correspondance");
      }
    } catch (error) {
      setError("Erreur lors de la création de la correspondance");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedInvoice = unmatchedInvoices.find(
    (inv) => inv.id === selectedInvoiceId
  );
  const selectedTransaction = unmatchedTransactions.find(
    (trans) => trans.id === selectedTransactionId
  );

  return (
    <Dialog open onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-[min(92vw,48rem)]">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Créer une correspondance manuelle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            >
              <AlertCircle className="size-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Sélection de la facture */}
          <FormField
            label={`Facture * (${unmatchedInvoices.length} disponibles)`}
          >
            {(field) => (
              <Combobox
                {...field}
                options={invoiceOptions.options}
                renderOption={invoiceOptions.render}
                limit={MAX_INVOICE_OPTIONS}
                value={selectedInvoiceId || undefined}
                onChange={(value) => setSelectedInvoiceId(value ?? "")}
                placeholder="Choisir une facture..."
                searchPlaceholder="Rechercher une facture..."
                emptyMessage="Aucune facture trouvée"
              />
            )}
          </FormField>

          {/* Aperçu de la facture sélectionnée */}
          {selectedInvoice && (
            <div className="rounded-lg bg-info/10 p-4">
              <h3 className="mb-2 text-sm font-medium">Facture sélectionnée</h3>
              <DataList
                items={[
                  { label: "Référence", value: selectedInvoice.ref || "N/A" },
                  { label: "Tiers", value: selectedInvoice.tiers || "N/A" },
                  {
                    label: "Montant TTC",
                    value: formatAmount(selectedInvoice.montantTTC),
                  },
                  {
                    label: "Date",
                    value: selectedInvoice.dateFacturation || "N/A",
                  },
                ]}
              />
            </div>
          )}

          {/* Sélection de la transaction */}
          <FormField
            label={`Transaction (optionnel) (${unmatchedTransactions.length} disponibles)`}
          >
            {(field) => (
              <Combobox
                {...field}
                options={transactionOptions.options}
                renderOption={transactionOptions.render}
                limit={MAX_TRANSACTION_OPTIONS}
                value={selectedTransactionId || undefined}
                onChange={(value) => setSelectedTransactionId(value ?? "")}
                placeholder="Aucune transaction (correspondance manuelle sans transaction)"
                searchPlaceholder="Rechercher une transaction..."
                emptyMessage="Aucune transaction trouvée"
              />
            )}
          </FormField>

          {/* Aperçu de la transaction sélectionnée */}
          {selectedTransaction && (
            <div className="rounded-lg bg-success/10 p-4">
              <h3 className="mb-2 text-sm font-medium">
                Transaction sélectionnée
              </h3>
              <DataList
                items={[
                  {
                    label: "Libellé",
                    value: selectedTransaction.libelles || "N/A",
                  },
                  {
                    label: "Montant",
                    value: formatAmount(selectedTransaction.montant),
                  },
                  {
                    label: "Détails",
                    value: selectedTransaction.detailsMouvement || "N/A",
                    wide: true,
                  },
                ]}
              />
            </div>
          )}

          {/* Comparaison des montants */}
          {selectedInvoice && selectedTransaction && (
            <div className="rounded-lg bg-warning/15 p-4">
              <h3 className="mb-2 text-sm font-medium">
                Comparaison des montants
              </h3>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Facture TTC:</span>
                  <span className="ml-2 font-medium">
                    {formatAmount(selectedInvoice.montantTTC)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Transaction:</span>
                  <span className="ml-2 font-medium">
                    {formatAmount(selectedTransaction.montant)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Différence:</span>
                  <span
                    className={`ml-2 font-medium ${
                      Math.abs(
                        selectedInvoice.montantTTC - selectedTransaction.montant
                      ) < 0.01
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {formatAmount(
                      Math.abs(
                        selectedInvoice.montantTTC - selectedTransaction.montant
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <FormField label="Notes explicatives (une par ligne)">
            {(field) => (
              <Textarea
                {...field}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Expliquer pourquoi cette correspondance est créée manuellement..."
              />
            )}
          </FormField>

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !selectedInvoiceId}>
              {loading ? (
                <Spinner size="sm" className="text-current" />
              ) : (
                <Plus />
              )}
              Créer la correspondance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
