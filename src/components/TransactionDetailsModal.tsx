"use client";

import { useState } from "react";
import { DetailedBankTransaction } from "@/types";
import { X, Eye, Calendar, Euro, FileText, Info } from "lucide-react";

interface TransactionDetailsModalProps {
  transaction: DetailedBankTransaction;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionDetailsModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailsModalProps) {
  if (!isOpen) return null;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Détails de la transaction
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations principales */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Informations principales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-blue-700 flex items-center">
                  <Euro className="h-4 w-4 mr-1" />
                  Montant:
                </span>
                <p className="text-blue-900 font-semibold text-lg">
                  {formatAmount(transaction.montant)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Date comptable:
                </span>
                <p className="text-blue-900">{transaction.dateComptable}</p>
              </div>
            </div>
          </div>

          {/* Libellés */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Libellés</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Libellé principal:
                </span>
                <p className="text-gray-900 mt-1 p-3 bg-white rounded border text-sm">
                  {transaction.libelles || "Aucun libellé"}
                </p>
              </div>
              {transaction.detailsMouvement && (
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Détails du mouvement:
                  </span>
                  <p className="text-gray-900 mt-1 p-3 bg-white rounded border text-sm whitespace-pre-wrap">
                    {transaction.detailsMouvement}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant bouton discret pour déclencher la modal
interface TransactionDetailsButtonProps {
  transaction: DetailedBankTransaction;
  className?: string;
  size?: "sm" | "md";
}

export function TransactionDetailsButton({
  transaction,
  className = "",
  size = "sm",
}: TransactionDetailsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        className={`text-gray-400 hover:text-blue-600 transition-colors cursor-pointer ${className}`}
        title="Voir les détails de la transaction"
      >
        <Eye className={sizeClasses[size]} />
      </button>

      <TransactionDetailsModal
        transaction={transaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
