"use client";

import { formatAmount } from "@/lib/format";
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
  const truncateText = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + "...";
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {transaction.libelles
            ? truncateText(transaction.libelles, maxLength)
            : "Libellé N/A"}
        </div>
        {(showAmount || showDate) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {showAmount && <span>{formatAmount(transaction.montant)}</span>}
            {showAmount && showDate && <span>•</span>}
            {showDate && <span>{transaction.dateComptable}</span>}
          </div>
        )}
      </div>
      <div className="ml-2 shrink-0">
        <TransactionDetailsButton transaction={transaction} />
      </div>
    </div>
  );
}
