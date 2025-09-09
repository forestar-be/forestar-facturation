"use client";

import { useState } from "react";
import {
  DetailedInvoice,
  DetailedBankTransaction,
  DetailedReconciliationMatch,
} from "@/types";
import { createMatch } from "@/lib/api";
import { X, Plus, RefreshCw, AlertCircle } from "lucide-react";
import {
  SearchableInvoiceDropdown,
  SearchableTransactionDropdown,
} from "./SearchableDropdown";

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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const selectedInvoice = unmatchedInvoices.find(
    (inv) => inv.id === selectedInvoiceId
  );
  const selectedTransaction = unmatchedTransactions.find(
    (trans) => trans.id === selectedTransactionId
  );

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Créer une correspondance manuelle
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

          {/* Sélection de la facture */}
          <SearchableInvoiceDropdown
            invoices={unmatchedInvoices}
            selectedInvoiceId={selectedInvoiceId}
            onInvoiceSelect={setSelectedInvoiceId}
            formatAmount={formatAmount}
            label="Facture"
            required={true}
          />

          {/* Aperçu de la facture sélectionnée */}
          {selectedInvoice && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Facture sélectionnée
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Référence:</span>
                  <p className="text-blue-900">
                    {selectedInvoice.ref || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Tiers:</span>
                  <p className="text-blue-900">
                    {selectedInvoice.tiers || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">
                    Montant TTC:
                  </span>
                  <p className="text-blue-900">
                    {formatAmount(selectedInvoice.montantTTC)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Date:</span>
                  <p className="text-blue-900">
                    {selectedInvoice.dateFacturation || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sélection de la transaction */}
          <SearchableTransactionDropdown
            transactions={unmatchedTransactions}
            selectedTransactionId={selectedTransactionId}
            onTransactionSelect={setSelectedTransactionId}
            formatAmount={formatAmount}
            label={`Transaction (optionnel) (${unmatchedTransactions.length} disponibles)`}
            emptyOptionText="Aucune transaction (correspondance manuelle sans transaction)"
          />

          {/* Aperçu de la transaction sélectionnée */}
          {selectedTransaction && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-2">
                Transaction sélectionnée
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-700">Libellé:</span>
                  <p className="text-green-900">
                    {selectedTransaction.libelles || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Montant:</span>
                  <p className="text-green-900">
                    {formatAmount(selectedTransaction.montant)}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-green-700">Détails:</span>
                  <p className="text-green-900">
                    {selectedTransaction.detailsMouvement || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comparaison des montants */}
          {selectedInvoice && selectedTransaction && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">
                Comparaison des montants
              </h3>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-yellow-700">Facture TTC:</span>
                  <span className="ml-2 font-medium text-yellow-900">
                    {formatAmount(selectedInvoice.montantTTC)}
                  </span>
                </div>
                <div>
                  <span className="text-yellow-700">Transaction:</span>
                  <span className="ml-2 font-medium text-yellow-900">
                    {formatAmount(selectedTransaction.montant)}
                  </span>
                </div>
                <div>
                  <span className="text-yellow-700">Différence:</span>
                  <span
                    className={`ml-2 font-medium ${
                      Math.abs(
                        selectedInvoice.montantTTC - selectedTransaction.montant
                      ) < 0.01
                        ? "text-green-600"
                        : "text-red-600"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes explicatives (une par ligne)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Expliquer pourquoi cette correspondance est créée manuellement..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !selectedInvoiceId}
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Créer la correspondance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
