import React from "react";
import { AlertTriangle } from "lucide-react";
import { DetailedReconciliationMatch } from "@/types";

interface MultipleMatchRowProps {
  invoiceId: string;
  invoice: any;
  matches: DetailedReconciliationMatch[];
  searchTerm?: string;
  getTransactionFromMatch?: (match: DetailedReconciliationMatch) => any;
  onResolve: (
    invoiceId: string,
    matches: DetailedReconciliationMatch[]
  ) => void;
}

export default function MultipleMatchRow({
  invoiceId,
  invoice,
  matches,
  searchTerm,
  getTransactionFromMatch,
  onResolve,
}: MultipleMatchRowProps) {
  // Compter les transactions qui correspondent au terme de recherche si fourni
  const getMatchingTransactionsInfo = () => {
    if (!searchTerm || !getTransactionFromMatch) {
      return {
        matchingCount: matches.length,
        totalCount: matches.length,
        hasFilter: false,
      };
    }

    const term = searchTerm.toLowerCase();

    // Vérifier si la facture elle-même correspond au terme de recherche
    const invoiceMatches =
      invoice?.ref?.toLowerCase().includes(term) ||
      invoice?.tiers?.toLowerCase().includes(term);

    // Si la facture correspond, toutes les transactions sont considérées comme correspondantes
    if (invoiceMatches) {
      return {
        matchingCount: matches.length,
        totalCount: matches.length,
        hasFilter: true,
      };
    }

    // Sinon, compter les transactions qui correspondent
    const matchingTransactions = matches.filter((match) => {
      const transaction = getTransactionFromMatch(match);
      return (
        transaction?.libelles?.toLowerCase().includes(term) ||
        transaction?.detailsMouvement?.toLowerCase().includes(term) ||
        match.matchType.toLowerCase().includes(term)
      );
    });

    return {
      matchingCount: matchingTransactions.length,
      totalCount: matches.length,
      hasFilter: true,
    };
  };

  const { matchingCount, totalCount, hasFilter } =
    getMatchingTransactionsInfo();
  const hasFilteredTransactions =
    hasFilter && matchingCount < totalCount && matchingCount > 0;

  return (
    <tr key={`multiple-${invoiceId}`} className="hover:bg-gray-50 bg-orange-50">
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {invoice?.ref || "N/A"}
        </div>
        <div className="text-sm text-gray-500">{invoice?.tiers || "N/A"}</div>
        <div className="text-sm text-gray-500">
          {invoice?.montantTTC.toFixed(2)} €
        </div>
        {invoice?.dateFacturation && (
          <div className="text-xs text-gray-400">{invoice.dateFacturation}</div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center text-orange-800">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <div>
            <div className="text-sm font-medium">
              {totalCount} correspondances possibles
              {hasFilteredTransactions && matchingCount && (
                <div className="text-xs text-blue-600 mt-1">
                  ({matchingCount} correspondent au filtre de recherche)
                </div>
              )}
            </div>
            <div className="text-xs text-orange-600">
              Résolution manuelle requise
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col space-y-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Multiple
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Action requise
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-orange-600">-</div>
      </td>
      <td className="px-6 py-4">
        <button
          onClick={() => onResolve(invoiceId, matches)}
          className="cursor-pointer inline-flex items-center px-3 py-1 border border-orange-300 text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Résoudre
        </button>
      </td>
    </tr>
  );
}
