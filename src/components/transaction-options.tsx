"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { ComboboxOption } from "@forestar-be/ui";
import { formatAmount } from "@/lib/format";
import type { DetailedBankTransaction, DetailedInvoice } from "@/types";

/** Plafonds d'options rendues à l'ouverture d'un menu : la recherche, elle, porte sur toutes. */
export const MAX_TRANSACTION_OPTIONS = 50;
export const MAX_INVOICE_OPTIONS = 100;

interface Options<T> {
  options: ComboboxOption[];
  render: (option: ComboboxOption) => ReactNode;
  byId: Map<string, T>;
}

/**
 * Options d'un `Combobox` de transactions.
 *
 * Le libellé est ce que le champ affiche une fois la transaction choisie ; les
 * mots-clés portent le reste de ce que la recherche couvrait : détails du
 * mouvement, montant brut, date.
 */
export function useTransactionOptions(
  transactions: DetailedBankTransaction[]
): Options<DetailedBankTransaction> {
  return useMemo(() => {
    const byId = new Map(transactions.map((t) => [t.id, t]));
    const options = transactions.map<ComboboxOption>((t) => ({
      value: t.id,
      label: `${t.libelles || "Libellé N/A"} - ${formatAmount(t.montant)} - ${
        t.dateComptable || "Date N/A"
      }`,
      keywords: [t.detailsMouvement, String(t.montant), t.dateComptable]
        .filter(Boolean)
        .join(" "),
    }));
    const render = (option: ComboboxOption) => {
      const t = byId.get(option.value);
      if (!t) return option.label;
      return (
        <span className="block min-w-0 text-sm">
          <span className="line-clamp-2 block font-medium whitespace-normal">
            {t.libelles || "Libellé N/A"}
          </span>
          <span className="block text-muted-foreground">
            {formatAmount(t.montant)} - {t.dateComptable || "Date N/A"}
          </span>
          {t.detailsMouvement && (
            <span className="block truncate text-xs text-muted-foreground">
              {t.detailsMouvement}
            </span>
          )}
        </span>
      );
    };
    return { options, render, byId };
  }, [transactions]);
}

/** Options d'un `Combobox` de factures : référence, tiers, montant TTC, date. */
export function useInvoiceOptions(
  invoices: DetailedInvoice[]
): Options<DetailedInvoice> {
  return useMemo(() => {
    const byId = new Map(invoices.map((i) => [i.id, i]));
    const options = invoices.map<ComboboxOption>((i) => ({
      value: i.id,
      label: `${i.ref || "Réf N/A"} - ${i.tiers || "Tiers N/A"} - ${formatAmount(
        i.montantTTC
      )}${i.dateFacturation ? ` - ${i.dateFacturation}` : ""}`,
      keywords: [String(i.montantTTC), i.dateFacturation]
        .filter(Boolean)
        .join(" "),
    }));
    const render = (option: ComboboxOption) => {
      const i = byId.get(option.value);
      if (!i) return option.label;
      return (
        <span className="block min-w-0 text-sm">
          <span className="block truncate font-medium">
            {i.ref || "Réf N/A"} - {i.tiers || "Tiers N/A"}
          </span>
          <span className="block text-muted-foreground">
            {formatAmount(i.montantTTC)}
            {i.dateFacturation && ` - ${i.dateFacturation}`}
          </span>
        </span>
      );
    };
    return { options, render, byId };
  }, [invoices]);
}
