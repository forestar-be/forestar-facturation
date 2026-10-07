"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  type ColumnDef,
} from "@forestar-be/ui";
import { Clock, Eye, FileText, Layers, Plus, Trash2 } from "lucide-react";
import StatusIcon from "@/components/StatusIcon";
import { deleteReconciliation, getAllReconciliations } from "@/lib/api";
import {
  formatDuration,
  formatInvoiceFamilies,
  getReconciliationDisplayTitle,
  getStatusLabel,
  getStatusTone,
} from "@/lib/reconciliationUtils";
import { useAuth } from "@/lib/auth";
import { ReconciliationSummary } from "@/types";

export default function ReconciliationsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [reconciliations, setReconciliations] = useState<
    ReconciliationSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReconciliations = async () => {
      try {
        setLoading(true);
        const data = await getAllReconciliations();
        setReconciliations(data);
      } catch (err) {
        setError("Erreur lors du chargement des réconciliations");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // La garde du layout n'affiche cette page qu'une fois la session prête.
    if (isAuthenticated) {
      fetchReconciliations();
    }
  }, [isAuthenticated]);

  const handleDeleteReconciliation = async (reconciliationId: string) => {
    setPendingDeleteId(null);

    try {
      setDeletingId(reconciliationId);
      const success = await deleteReconciliation(reconciliationId);

      if (success) {
        // Retirer la réconciliation de la liste
        setReconciliations((prev) =>
          prev.filter((r) => r.id !== reconciliationId)
        );
      } else {
        setError("Erreur lors de la suppression de la réconciliation");
      }
    } catch (err) {
      setError("Erreur lors de la suppression de la réconciliation");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo<ColumnDef<ReconciliationSummary>[]>(
    () => [
      {
        id: "reconciliation",
        header: "Réconciliation",
        enableSorting: false,
        meta: { maxWidth: false },
        cell: ({ row }) => {
          const reconciliation = row.original;
          return (
            <div className="flex items-start gap-3">
              <StatusIcon
                status={reconciliation.status}
                className="mt-0.5 size-5 shrink-0"
              />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {getReconciliationDisplayTitle(
                      reconciliation.title,
                      reconciliation.createdAt
                    )}
                  </span>
                  <StatusBadge tone={getStatusTone(reconciliation.status)}>
                    {getStatusLabel(reconciliation.status)}
                  </StatusBadge>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FileText className="size-3.5 shrink-0" />
                    {reconciliation.invoicesFileName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="size-3.5 shrink-0" />
                    {reconciliation.transactionsFileName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="size-3.5 shrink-0" />
                    Familles :{" "}
                    {formatInvoiceFamilies(reconciliation.invoiceFamilies)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 shrink-0" />
                    {formatDuration(
                      reconciliation.startTime,
                      reconciliation.endTime
                    )}
                  </span>
                </div>
                {reconciliation.status === "ERROR" &&
                  reconciliation.errorMessage && (
                    <div className="rounded-md bg-destructive/10 p-2 text-sm whitespace-normal text-destructive">
                      {reconciliation.errorMessage}
                    </div>
                  )}
              </div>
            </div>
          );
        },
      },
      {
        id: "volumes",
        header: "Volumes",
        enableSorting: false,
        meta: { maxWidth: false },
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-medium">
              {row.original.totalInvoices} factures
            </div>
            <div className="text-muted-foreground">
              {row.original.totalTransactions} transactions
            </div>
          </div>
        ),
      },
      {
        id: "matched",
        header: "Appariées",
        enableSorting: false,
        meta: { maxWidth: false },
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-medium">
              {row.original.exactMatches + row.original.fuzzyMatches} appariées
            </div>
            <div className="text-muted-foreground">
              {row.original.reconciliationRate}% de réussite
            </div>
          </div>
        ),
      },
      {
        id: "amount",
        header: "Montant",
        enableSorting: false,
        meta: { maxWidth: false },
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-medium">
              {row.original.totalMatchedAmount.toFixed(2)} €
            </div>
            <div className="text-muted-foreground">montant apparié</div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        meta: { maxWidth: false },
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/reconciliations/${row.original.id}`)}
            >
              <Eye />
              Voir
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              aria-label="Supprimer"
              title="Supprimer"
              disabled={deletingId === row.original.id}
              onClick={() => setPendingDeleteId(row.original.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      },
    ],
    [router, deletingId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique des Réconciliations"
        description="Consultez et gérez toutes vos réconciliations bancaires"
        actions={
          <Button onClick={() => router.push("/")}>
            <Plus />
            Nouvelle réconciliation
          </Button>
        }
      />

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      ) : !loading && reconciliations.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune réconciliation"
          description="Commencez par créer votre première réconciliation bancaire."
          action={
            <Button onClick={() => router.push("/")}>
              <Plus />
              Nouvelle réconciliation
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={reconciliations}
          loading={loading}
          getRowId={(reconciliation) => reconciliation.id}
        />
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        type="delete"
        title="Supprimer la réconciliation"
        message="Êtes-vous sûr de vouloir supprimer cette réconciliation ? Cette action est irréversible."
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) void handleDeleteReconciliation(pendingDeleteId);
        }}
      />
    </div>
  );
}
