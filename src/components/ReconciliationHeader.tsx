import React from "react";
import { ArrowLeft, FileText, CreditCard, CheckCircle } from "lucide-react";
import { ReconciliationDetails } from "@/types";
import StatusIcon from "@/components/StatusIcon";
import InfoModal from "./InfoModal";
import TitleEditor from "./TitleEditor";
import { updateReconciliationTitle } from "@/lib/api";
import {
  getStatusLabel,
  formatDate,
  formatDuration,
  getReconciliationDisplayTitle,
} from "@/lib/reconciliationUtils";

interface ReconciliationHeaderProps {
  reconciliation: ReconciliationDetails;
  onBack: () => void;
  onTitleUpdate?: (newTitle: string) => void;
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
    <div className="space-y-4">
      {/* Header avec titre à gauche et statistiques à droite */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0 mr-4">
          <button
            onClick={onBack}
            className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </button>
          <div className="flex-1 min-w-0">
            <TitleEditor
              title={displayTitle}
              onSave={handleTitleSave}
              placeholder="Entrez un titre pour cette réconciliation"
              className="w-full"
            />
            <div className="flex items-center mt-1">
              <StatusIcon status={reconciliation.status} />
              <span className="ml-2 text-sm text-gray-600">
                {getStatusLabel(reconciliation.status)}
              </span>
              {reconciliation.endTime && (
                <>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm text-gray-600">
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

        {/* Statistiques en cards alignées à droite */}
        <div className="flex space-x-3">
          <div className="bg-white overflow-hidden shadow rounded-lg min-w-[140px] relative">
            <div className="px-4 py-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <div className="text-xs font-medium text-gray-500">
                    Factures
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {reconciliation.totalInvoices}
                  </div>
                </div>
              </div>
            </div>
            {/* InfoModal positionné en dehors du overflow-hidden */}
            <div className="absolute top-2 right-2 z-10">
              <InfoModal
                title="Factures incluses"
                content={
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      Les factures affichées sont filtrées selon les critères
                      suivants :
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Exclusion des factures en espèces</li>
                      <li>Exclusion des ventes au comptoir</li>
                      <li>
                        Exclusion des factures dupliquées (acompte et standard)
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-gray-500">
                      Seules les factures nécessitant une réconciliation
                      bancaire sont incluses.
                    </p>
                  </div>
                }
              />
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg min-w-[140px]">
            <div className="px-4 py-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <div className="text-xs font-medium text-gray-500">
                    Transactions
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {reconciliation.totalTransactions}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg min-w-[160px]">
            <div className="px-4 py-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <div className="text-xs font-medium text-gray-500">
                    Appariées
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {reconciliation.exactMatches + reconciliation.fuzzyMatches}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      / {reconciliation.totalInvoices}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
