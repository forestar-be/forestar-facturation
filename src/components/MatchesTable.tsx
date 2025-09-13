import React from "react";
import { DetailedReconciliationMatch } from "@/types";
import MatchesTableHeader from "./MatchesTableHeader";
import SingleMatchRow from "./SingleMatchRow";
import MultipleMatchRow from "./MultipleMatchRow";

interface DisplayItem {
  type: "single" | "multiple";
  invoiceId: string;
  invoice: any;
  match?: DetailedReconciliationMatch;
  matches?: DetailedReconciliationMatch[];
  sortValue?: any;
}

interface MatchesTableProps {
  displayItems: DisplayItem[];
  searchTerm?: string;
  getTransactionFromMatch: (match: DetailedReconciliationMatch) => any;
  onViewMatch: (match: DetailedReconciliationMatch) => void;
  onEditMatch: (match: DetailedReconciliationMatch) => void;
  onValidateMatch?: (match: DetailedReconciliationMatch) => void;
  onRejectMatch?: (match: DetailedReconciliationMatch) => void;
  onResolveMultiple: (
    invoiceId: string,
    matches: DetailedReconciliationMatch[]
  ) => void;
}

export default function MatchesTable({
  displayItems,
  searchTerm,
  getTransactionFromMatch,
  onViewMatch,
  onEditMatch,
  onValidateMatch,
  onRejectMatch,
  onResolveMultiple,
}: MatchesTableProps) {
  if (displayItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune correspondance trouvée</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <MatchesTableHeader />
        <tbody className="bg-white divide-y divide-gray-200">
          {displayItems.map((item) => {
            if (item.type === "multiple") {
              return (
                <MultipleMatchRow
                  key={`multiple-${item.invoiceId}`}
                  invoiceId={item.invoiceId}
                  invoice={item.invoice}
                  matches={item.matches || []}
                  searchTerm={searchTerm}
                  getTransactionFromMatch={getTransactionFromMatch}
                  onResolve={onResolveMultiple}
                />
              );
            } else {
              const match = item.match!;
              const invoice = item.invoice;
              const transaction = getTransactionFromMatch(match);

              return (
                <SingleMatchRow
                  key={match.id}
                  match={match}
                  invoice={invoice}
                  transaction={transaction}
                  onView={() => onViewMatch(match)}
                  onEdit={() => onEditMatch(match)}
                  onValidate={
                    onValidateMatch ? () => onValidateMatch(match) : undefined
                  }
                  onReject={
                    onRejectMatch ? () => onRejectMatch(match) : undefined
                  }
                />
              );
            }
          })}
        </tbody>
      </table>
    </div>
  );
}
