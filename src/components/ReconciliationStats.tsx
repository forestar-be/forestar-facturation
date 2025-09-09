import React from "react";
import {
  FileText,
  CreditCard,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { ReconciliationDetails } from "@/types";
import InfoModal from "./InfoModal";

interface ReconciliationStatsProps {
  reconciliation: ReconciliationDetails;
}

export default function ReconciliationStats({
  reconciliation,
}: ReconciliationStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate flex items-center gap-1">
                  Factures
                  <InfoModal
                    title="Factures incluses"
                    content={
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>
                          Les factures affichées sont filtrées selon les
                          critères suivants :
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Exclusion des factures en espèces</li>
                          <li>Exclusion des ventes au comptoir</li>
                          <li>
                            Exclusion des factures dupliquées (acompte et
                            standard)
                          </li>
                        </ul>
                        <p className="mt-3 text-xs text-gray-500">
                          Seules les factures nécessitant une réconciliation
                          bancaire sont incluses.
                        </p>
                      </div>
                    }
                  />
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {reconciliation.totalInvoices}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Transactions
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {reconciliation.totalTransactions}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Appariées
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {reconciliation.exactMatches + reconciliation.fuzzyMatches}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    / {reconciliation.totalInvoices}
                  </span>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Non appariées
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {reconciliation.noMatches}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Taux de réussite
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {reconciliation.reconciliationRate}%
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
