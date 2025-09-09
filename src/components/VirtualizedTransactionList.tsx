"use client";

import { memo, useMemo } from "react";
import { DetailedBankTransaction } from "@/types";
import { TransactionDetailsButton } from "./TransactionDetailsModal";

interface VirtualizedTransactionListProps {
  transactions: DetailedBankTransaction[];
  selectedTransactionId: string;
  onTransactionSelect: (transactionId: string) => void;
  formatAmount: (amount: number) => string;
  maxVisibleItems?: number;
}

// Composant optimisé pour le rendu d'une transaction individuelle
const TransactionItem = memo(
  ({
    transaction,
    isSelected,
    onSelect,
    formatAmount,
  }: {
    transaction: DetailedBankTransaction;
    isSelected: boolean;
    onSelect: () => void;
    formatAmount: (amount: number) => string;
  }) => (
    <div
      className={`cursor-pointer px-3 py-2 hover:bg-gray-50 border-b ${
        isSelected ? "bg-blue-50" : ""
      }`}
      onClick={onSelect}
    >
      <div className="text-sm">
        <div className="font-medium text-gray-900 flex items-start">
          <span className="flex-1 pr-2 line-clamp-3">
            {transaction.libelles || "Libellé N/A"}
          </span>
          <TransactionDetailsButton
            transaction={transaction}
            className="flex-shrink-0 mt-0.5"
            size="sm"
          />
        </div>
        <div className="text-gray-500">
          {formatAmount(transaction.montant)} -{" "}
          {transaction.dateComptable || "Date N/A"}
        </div>
        {transaction.detailsMouvement && (
          <div className="text-xs text-gray-400 truncate">
            {transaction.detailsMouvement}
          </div>
        )}
      </div>
    </div>
  )
);

TransactionItem.displayName = "TransactionItem";

export const VirtualizedTransactionList = memo(
  ({
    transactions,
    selectedTransactionId,
    onTransactionSelect,
    formatAmount,
    maxVisibleItems = 100, // Limiter le nombre d'éléments visibles pour les performances
  }: VirtualizedTransactionListProps) => {
    // Optimisation: ne rendre que les premiers éléments si la liste est trop longue
    const visibleTransactions = useMemo(() => {
      if (transactions.length <= maxVisibleItems) {
        return transactions;
      }

      // Si la transaction sélectionnée n'est pas dans les premiers éléments, l'inclure
      const selectedIndex = transactions.findIndex(
        (t) => t.id === selectedTransactionId
      );
      if (selectedIndex !== -1 && selectedIndex >= maxVisibleItems) {
        return [
          ...transactions.slice(0, maxVisibleItems - 1),
          transactions[selectedIndex],
        ];
      }

      return transactions.slice(0, maxVisibleItems);
    }, [transactions, selectedTransactionId, maxVisibleItems]);

    const hasMoreItems = transactions.length > maxVisibleItems;

    return (
      <>
        {visibleTransactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            isSelected={selectedTransactionId === transaction.id}
            onSelect={() => onTransactionSelect(transaction.id)}
            formatAmount={formatAmount}
          />
        ))}
        {hasMoreItems && (
          <div className="px-3 py-2 text-xs text-gray-500 italic border-b">
            ... et {transactions.length - maxVisibleItems} autres transactions
            {selectedTransactionId &&
              !visibleTransactions.some(
                (t) => t.id === selectedTransactionId
              ) &&
              " (transaction sélectionnée incluse ci-dessus)"}
          </div>
        )}
      </>
    );
  }
);

VirtualizedTransactionList.displayName = "VirtualizedTransactionList";
