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
        <div className="flex items-center gap-2 rounded-lg border border-warning/35 bg-warning/15 p-3 text-sm">
          <AlertCircle className="size-4 shrink-0 text-warning" />
          <span>
            {unmatchedInvoicesCount} facture(s) et {unmatchedTransactionsCount}{" "}
            transaction(s) non appariées disponibles pour correspondances
            manuelles
          </span>
        </div>
      )}

      {hasMultipleMatches && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/35 bg-warning/15 p-3 text-sm">
          <AlertCircle className="size-4 shrink-0 text-warning" />
          <span>
            <strong>{invoicesWithMultipleMatches.length} facture(s)</strong> ont
            des correspondances multiples qui nécessitent un choix manuel
          </span>
        </div>
      )}
    </div>
  );
}
