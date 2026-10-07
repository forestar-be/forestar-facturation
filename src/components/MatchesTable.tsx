import React, { useMemo } from "react";
import { AlertTriangle, Check, Eye, Pencil, X } from "lucide-react";
import {
  Button,
  DataTable,
  Progress,
  StatusBadge,
  type ColumnDef,
} from "@forestar-be/ui";
import { DetailedReconciliationMatch } from "@/types";
import {
  getConfidenceDisplay,
  getMatchTypeOnly,
  getMatchTypeTone,
  getValidationStatusLabel,
  getValidationStatusTone,
} from "@/lib/reconciliationUtils";
import TransactionCell from "./TransactionCell";

export interface DisplayItem {
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

/** Combien de transactions d'une facture à correspondances multiples répondent à la recherche. */
function getMatchingTransactionsInfo(
  invoice: any,
  matches: DetailedReconciliationMatch[],
  searchTerm: string | undefined,
  getTransactionFromMatch: (match: DetailedReconciliationMatch) => any
) {
  if (!searchTerm) {
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
}

function InvoiceCell({ invoice }: { invoice: any }) {
  return (
    <div className="space-y-0.5">
      <div className="font-medium">{invoice?.ref || "N/A"}</div>
      <div className="text-muted-foreground">{invoice?.tiers || "N/A"}</div>
      <div className="text-muted-foreground">
        {invoice?.montantTTC.toFixed(2)} €
      </div>
      {invoice?.dateFacturation && (
        <div className="text-xs text-muted-foreground">
          {invoice.dateFacturation}
        </div>
      )}
    </div>
  );
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
  const columns = useMemo<ColumnDef<DisplayItem>[]>(
    () => [
      {
        id: "invoice",
        header: "Facture",
        enableSorting: false,
        meta: { maxWidth: false },
        cell: ({ row }) => <InvoiceCell invoice={row.original.invoice} />,
      },
      {
        id: "transaction",
        header: "Transaction",
        enableSorting: false,
        meta: { maxWidth: false },
        cell: ({ row }) => {
          const item = row.original;

          if (item.type === "multiple") {
            const matches = item.matches || [];
            const { matchingCount, totalCount, hasFilter } =
              getMatchingTransactionsInfo(
                item.invoice,
                matches,
                searchTerm,
                getTransactionFromMatch
              );
            const hasFilteredTransactions =
              hasFilter && matchingCount < totalCount && matchingCount > 0;

            return (
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="size-4 shrink-0" />
                <div>
                  <div className="font-medium">
                    {totalCount} correspondances possibles
                    {hasFilteredTransactions && matchingCount && (
                      <div className="mt-1 text-xs text-info">
                        ({matchingCount} correspondent au filtre de recherche)
                      </div>
                    )}
                  </div>
                  <div className="text-xs">Résolution manuelle requise</div>
                </div>
              </div>
            );
          }

          const match = item.match!;
          const transaction = getTransactionFromMatch(match);
          return transaction ? (
            <div className="max-w-xs">
              <TransactionCell
                transaction={transaction}
                showAmount={true}
                showDate={true}
                maxLength={40}
              />
              {transaction.detailsMouvement && (
                <div className="mt-1 max-w-xs truncate text-muted-foreground">
                  {transaction.detailsMouvement}
                </div>
              )}
            </div>
          ) : (
            <div
              className={`italic ${
                match.validationStatus === "REJECTED"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {match.validationStatus === "REJECTED"
                ? "Association supprimée (rejetée)"
                : "Aucune transaction"}
            </div>
          );
        },
      },
      {
        id: "type",
        header: "Type/Statut",
        enableSorting: false,
        meta: { maxWidth: false },
        cell: ({ row }) => {
          const item = row.original;

          if (item.type === "multiple") {
            return (
              <div className="flex flex-col items-start gap-1">
                <StatusBadge tone="warning">
                  <AlertTriangle />
                  Multiple
                </StatusBadge>
                <StatusBadge tone="warning">Action requise</StatusBadge>
              </div>
            );
          }

          const match = item.match!;
          return (
            <div className="flex flex-col items-start gap-1">
              <StatusBadge
                tone={getMatchTypeTone(match.matchType, match.isManualMatch)}
              >
                {getMatchTypeOnly(match.matchType, match.isManualMatch)}
              </StatusBadge>
              <StatusBadge
                tone={getValidationStatusTone(match.validationStatus)}
              >
                {getValidationStatusLabel(match.validationStatus)}
              </StatusBadge>
            </div>
          );
        },
      },
      {
        id: "confidence",
        header: "Confiance",
        enableSorting: false,
        meta: { maxWidth: false },
        cell: ({ row }) => {
          const item = row.original;
          if (item.type === "multiple") {
            return <div className="text-warning">-</div>;
          }

          const match = item.match!;
          const confidence = getConfidenceDisplay(
            match,
            Boolean(getTransactionFromMatch(match))
          );
          return (
            <div className="flex min-w-28 items-center gap-2">
              <Progress
                value={confidence.percent}
                tone={confidence.tone}
                aria-label="Confiance"
              />
              <span className="text-muted-foreground">{confidence.label}</span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        meta: { maxWidth: false },
        cell: ({ row }) => {
          const item = row.original;

          if (item.type === "multiple") {
            return (
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  onResolveMultiple(item.invoiceId, item.matches || [])
                }
              >
                <AlertTriangle />
                Résoudre
              </Button>
            );
          }

          const match = item.match!;
          return (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onViewMatch(match)}
                >
                  <Eye />
                  Voir
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onEditMatch(match)}
                >
                  <Pencil />
                  Modifier
                </Button>
              </div>

              {/* Boutons Valider/Rejeter - toujours affichés */}
              {onValidateMatch && onRejectMatch && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    className="text-success"
                    title="Valider cette correspondance"
                    onClick={() => onValidateMatch(match)}
                  >
                    <Check />
                    Valider
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    title="Rejeter cette correspondance"
                    onClick={() => onRejectMatch(match)}
                  >
                    <X />
                    Rejeter
                  </Button>
                </div>
              )}
            </div>
          );
        },
      },
    ],
    [
      searchTerm,
      getTransactionFromMatch,
      onViewMatch,
      onEditMatch,
      onValidateMatch,
      onRejectMatch,
      onResolveMultiple,
    ]
  );

  return (
    <DataTable
      columns={columns}
      data={displayItems}
      // La page porte déjà la pagination : le tableau reçoit la page courante
      // (100 lignes au plus) et ne doit pas la redécouper. `pageSize` n'est lu
      // qu'au premier rendu, d'où un plafond large plutôt que la longueur.
      pageSize={1000}
      emptyMessage="Aucune correspondance trouvée"
      getRowId={(item) =>
        item.type === "multiple" ? `multiple-${item.invoiceId}` : item.match!.id
      }
      getRowClassName={(item) =>
        item.type === "multiple" ? "bg-warning/10" : undefined
      }
    />
  );
}
