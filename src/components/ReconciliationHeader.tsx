import React from "react";
import { ArrowLeft, FileText, CreditCard, CheckCircle } from "lucide-react";
import { Button, Card } from "@forestar-be/ui";
import { ReconciliationDetails } from "@/types";
import StatusIcon from "@/components/StatusIcon";
import InfoModal from "./InfoModal";
import TitleEditor from "./TitleEditor";
import { updateReconciliationTitle } from "@/lib/api";
import {
  getStatusLabel,
  formatDuration,
  getReconciliationDisplayTitle,
} from "@/lib/reconciliationUtils";

interface ReconciliationHeaderProps {
  reconciliation: ReconciliationDetails;
  onBack: () => void;
  onTitleUpdate?: (newTitle: string) => void;
}

function StatCard({
  icon,
  label,
  children,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card size="sm" className="relative min-w-[140px] flex-1 sm:flex-none">
      <div className="flex items-center gap-3 px-4">
        {icon}
        <div>
          <div className="text-xs font-medium text-muted-foreground">
            {label}
          </div>
          <div className="text-lg font-semibold">{children}</div>
        </div>
      </div>
      {action && <div className="absolute top-1 right-1">{action}</div>}
    </Card>
  );
}

export default function ReconciliationHeader({
  reconciliation,
  onBack,
  onTitleUpdate,
}: ReconciliationHeaderProps) {
  const handleTitleSave = async (newTitle: string): Promise<boolean> => {
    try {
      const success = await updateReconciliationTitle(
        reconciliation.id,
        newTitle
      );
      if (success && onTitleUpdate) {
        onTitleUpdate(newTitle);
      }
      return success;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du titre:", error);
      return false;
    }
  };

  const displayTitle = getReconciliationDisplayTitle(
    reconciliation.title,
    reconciliation.createdAt
  );
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      {/* Titre à gauche */}
      <div className="flex min-w-0 flex-1 basis-80 items-center gap-4">
        <Button variant="outline" onClick={onBack} className="shrink-0">
          <ArrowLeft />
          Retour
        </Button>
        <div className="min-w-0 flex-1">
          <TitleEditor
            title={displayTitle}
            onSave={handleTitleSave}
            placeholder="Entrez un titre pour ce rapprochement"
            className="w-full"
          />
          <div className="mt-1 flex flex-wrap items-center text-sm text-muted-foreground">
            <StatusIcon status={reconciliation.status} />
            <span className="ml-2">
              {getStatusLabel(reconciliation.status)}
            </span>
            {reconciliation.endTime && (
              <>
                <span className="mx-2">•</span>
                <span>
                  Durée:{" "}
                  {formatDuration(
                    reconciliation.startTime,
                    reconciliation.endTime
                  )}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques en cartes alignées à droite */}
      <div className="flex w-full flex-wrap gap-3 sm:w-auto">
        <StatCard
          icon={<FileText className="size-5 text-muted-foreground" />}
          label="Factures"
          action={
            <InfoModal
              title="Factures incluses"
              content={
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Les factures affichées sont filtrées selon les critères
                    suivants :
                  </p>
                  <ul className="ml-2 list-inside list-disc space-y-1">
                    <li>Exclusion des factures en espèces</li>
                    <li>Exclusion des ventes au comptoir</li>
                    <li>
                      Exclusion des factures dupliquées (acompte et standard)
                    </li>
                  </ul>
                  <p className="mt-3 text-xs">
                    Seules les factures nécessitant un rapprochement bancaire
                    sont incluses.
                  </p>
                </div>
              }
            />
          }
        >
          {reconciliation.totalInvoices}
        </StatCard>

        <StatCard
          icon={<CreditCard className="size-5 text-muted-foreground" />}
          label="Transactions"
        >
          {reconciliation.totalTransactions}
        </StatCard>

        <StatCard
          icon={<CheckCircle className="size-5 text-success" />}
          label="Appariées"
        >
          {reconciliation.exactMatches + reconciliation.fuzzyMatches}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / {reconciliation.totalInvoices}
          </span>
        </StatCard>
      </div>
    </div>
  );
}
