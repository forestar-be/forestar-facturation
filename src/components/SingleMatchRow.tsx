import React from "react";
import { Eye, Edit, Check, X } from "lucide-react";
import { DetailedReconciliationMatch } from "@/types";
import {
  getMatchTypeLabel,
  getMatchTypeColor,
  getMatchTypeOnly,
  getValidationStatusLabel,
  getValidationStatusColor,
  getMatchTypeOnlyColor,
  getValidationStatusChipColor,
} from "@/lib/reconciliationUtils";
import TransactionCell from "./TransactionCell";

interface SingleMatchRowProps {
  match: DetailedReconciliationMatch;
  invoice: any;
  transaction: any;
  onView: (match: DetailedReconciliationMatch) => void;
  onEdit: (match: DetailedReconciliationMatch) => void;
  onValidate?: (match: DetailedReconciliationMatch) => void;
  onReject?: (match: DetailedReconciliationMatch) => void;
}

export default function SingleMatchRow({
  match,
  invoice,
  transaction,
  onView,
  onEdit,
  onValidate,
  onReject,
}: SingleMatchRowProps) {
  // Les boutons Valider/Rejeter sont toujours affichés
  const shouldShowValidationButtons = true;
  return (
    <tr key={match.id} className="hover:bg-gray-50">
      <td className="px-6 py-3">
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
      <td className="px-6 py-3">
        {transaction ? (
          <div>
            <TransactionCell
              transaction={transaction}
              showAmount={true}
              showDate={true}
              maxLength={40}
            />
            {transaction.detailsMouvement && (
              <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                {transaction.detailsMouvement}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`text-sm italic ${
              match.validationStatus === "REJECTED"
                ? "text-rose-500"
                : "text-gray-400"
            }`}
          >
            {match.validationStatus === "REJECTED"
              ? "Association supprimée (rejetée)"
              : "Aucune transaction"}
          </div>
        )}
      </td>
      <td className="px-6 py-3">
        <div className="flex flex-col space-y-1">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchTypeOnlyColor(
              match.matchType,
              match.isManualMatch
            )}`}
          >
            {getMatchTypeOnly(match.matchType, match.isManualMatch)}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getValidationStatusChipColor(
              match.validationStatus
            )}`}
          >
            {getValidationStatusLabel(match.validationStatus)}
          </span>
        </div>
      </td>
      <td className="px-6 py-3">
        <div className="flex items-center">
          {match.isManualMatch && transaction ? (
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                <div
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: "100%" }}
                ></div>
              </div>
              <span className="text-sm text-purple-600 font-medium min-w-0">
                100%
              </span>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                <div
                  className={`h-2 rounded-full ${
                    match.validationStatus === "VALIDATED" && transaction
                      ? "bg-emerald-500"
                      : match.validationStatus === "REJECTED" || !transaction
                        ? "bg-rose-500"
                        : match.confidence >= 80
                          ? "bg-green-500"
                          : match.confidence >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                  }`}
                  style={{
                    width: `${
                      match.validationStatus === "VALIDATED" && transaction
                        ? 100
                        : match.validationStatus === "REJECTED" || !transaction
                          ? 0
                          : match.confidence
                    }%`,
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 min-w-0">
                {match.validationStatus === "VALIDATED" && transaction
                  ? "100%"
                  : match.validationStatus === "REJECTED" || !transaction
                    ? "0%"
                    : `${match.confidence.toFixed(0)}%`}
              </span>
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-3">
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={() => onView(match)}
              className="cursor-pointer inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <Eye className="h-3 w-3 mr-1" />
              Voir
            </button>
            <button
              onClick={() => onEdit(match)}
              className="cursor-pointer inline-flex items-center px-2 py-1 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-3 w-3 mr-1" />
              Modifier
            </button>
          </div>

          {/* Boutons Valider/Rejeter - toujours affichés */}
          {shouldShowValidationButtons && onValidate && onReject && (
            <div className="flex space-x-2">
              <button
                onClick={() => onValidate(match)}
                className="cursor-pointer inline-flex items-center px-2 py-1 border border-emerald-300 text-xs font-medium rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                title="Valider cette correspondance"
              >
                <Check className="h-3 w-3 mr-1" />
                Valider
              </button>
              <button
                onClick={() => onReject(match)}
                className="cursor-pointer inline-flex items-center px-2 py-1 border border-rose-300 text-xs font-medium rounded text-rose-700 bg-rose-50 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                title="Rejeter cette correspondance"
              >
                <X className="h-3 w-3 mr-1" />
                Rejeter
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
