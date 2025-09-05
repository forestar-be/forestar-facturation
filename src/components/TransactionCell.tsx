"use client";

import { DetailedBankTransaction } from "@/types";
import { TransactionDetailsButton } from "./TransactionDetailsModal";

interface TransactionCellProps {
  transaction: DetailedBankTransaction;
  showAmount?: boolean;
  showDate?: boolean;
  className?: string;
  maxLength?: number;
}

export default function TransactionCell({
  transaction,
  showAmount = false,
  showDate = false,
  className = "",
  maxLength = 50,
}: TransactionCellProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const truncateText = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + "...";
  };

  return (
    <div className={`flex items-center group ${className}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {transaction.libelles
            ? truncateText(transaction.libelles, maxLength)
            : "Libellé N/A"}
        </div>
        {(showAmount || showDate) && (
          <div className="text-xs text-gray-500 flex items-center space-x-2">
            {showAmount && <span>{formatAmount(transaction.montant)}</span>}
            {showAmount && showDate && <span>•</span>}
            {showDate && <span>{transaction.dateComptable}</span>}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 ml-2 transition-opacity">
        <TransactionDetailsButton transaction={transaction} size="sm" />
      </div>
    </div>
  );
}

// Hook pour utiliser dans les cellules de tableau
export function useTransactionCell() {
  return TransactionCell;
}
