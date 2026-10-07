"use client";

import { StatusBadge } from "@forestar-be/ui";
import { formatAmount } from "@/lib/format";
import { getMatchTypeTone } from "@/lib/reconciliationUtils";
import { MatchSuggestion } from "@/types";
import { TransactionDetailsButton } from "./TransactionDetailsModal";

interface SuggestionRowProps {
  suggestion: MatchSuggestion;
  onSelect: () => void;
  /** Mise en avant de la suggestion automatique du système. */
  highlighted?: boolean;
  /** Texte du badge, avec le pourcentage. */
  confidenceLabel?: (confidence: string) => string;
}

/**
 * Suggestion de transaction : un bouton pour la choisir, et à côté — jamais à
 * l'intérieur — celui qui ouvre ses détails.
 */
export default function SuggestionRow({
  suggestion,
  onSelect,
  highlighted = false,
  confidenceLabel = (confidence) => `Confiance ${confidence}%`,
}: SuggestionRowProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border p-3 ${
        highlighted ? "border-2 border-info/40 bg-info/10" : "hover:bg-muted/50"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className="min-w-0 flex-1">
          <span className="line-clamp-3 block text-sm font-medium">
            {suggestion.transaction.libelles || "N/A"}
          </span>
          <span className="block text-sm text-muted-foreground">
            {formatAmount(suggestion.transaction.montant)} -{" "}
            {suggestion.transaction.dateComptable}
          </span>
        </span>
        <StatusBadge tone={getMatchTypeTone(suggestion.matchType)}>
          {confidenceLabel(suggestion.confidence.toFixed(0))}
        </StatusBadge>
      </button>
      <TransactionDetailsButton transaction={suggestion.transaction} />
    </div>
  );
}
