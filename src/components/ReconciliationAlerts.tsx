import React from "react";
import { AlertCircle } from "lucide-react";
import { DetailedReconciliationMatch } from "@/types";

interface ReconciliationAlertsProps {
  unmatchedInvoicesCount: number;
  unmatchedTransactionsCount: number;
  invoicesWithMultipleMatches: {
    invoiceId: string;
    matches: DetailedReconciliationMatch[];
  }[];
}

export default function ReconciliationAlerts({
  unmatchedInvoicesCount,
  unmatchedTransactionsCount,
  invoicesWithMultipleMatches,
}: ReconciliationAlertsProps) {
  const hasUnmatchedItems =
    unmatchedInvoicesCount > 0 || unmatchedTransactionsCount > 0;
  const hasMultipleMatches = invoicesWithMultipleMatches.length > 0;

  if (!hasUnmatchedItems && !hasMultipleMatches) {
    return null;
  }

  return (
    <div className="space-y-2">
      {hasUnmatchedItems && (
        <div className="p-3 bg-yellow-50 rounded-md">
          <div className="flex items-center text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>
              {unmatchedInvoicesCount} facture(s) et{" "}
              {unmatchedTransactionsCount} transaction(s) non appariées
              disponibles pour correspondances manuelles
            </span>
          </div>
        </div>
      )}

      {hasMultipleMatches && (
        <div className="p-3 bg-orange-50 rounded-md">
          <div className="flex items-center text-sm text-orange-800">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>
              <strong>{invoicesWithMultipleMatches.length} facture(s)</strong>{" "}
              ont des correspondances multiples qui nécessitent un choix manuel
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
