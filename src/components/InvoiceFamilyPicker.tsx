"use client";

import { Badge, Checkbox } from "@forestar-be/ui";
import { formatAmount } from "@/lib/format";
import { summarizeSelectedFamilies } from "@/lib/reconciliationUtils";
import type { InvoiceFamilySummary } from "@/types";

interface InvoiceFamilyPickerProps {
  families: InvoiceFamilySummary[];
  /** Codes des familles cochées. */
  selected: ReadonlySet<string>;
  onChange: (selected: Set<string>) => void;
  disabled?: boolean;
}

/**
 * Familles de factures trouvées dans la source (R005) : une case par famille,
 * pré-cochée selon `defaultSelected`, et le total des familles cochées.
 */
export default function InvoiceFamilyPicker({
  families,
  selected,
  onChange,
  disabled = false,
}: InvoiceFamilyPickerProps) {
  const toggle = (family: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(family);
    else next.delete(family);
    onChange(next);
  };

  const total = summarizeSelectedFamilies(families, selected);

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium">
        Familles de factures à rapprocher
      </legend>
      <ul className="divide-y rounded-lg border">
        {families.map((f) => {
          const id = `family-${f.family}`;
          return (
            <li key={f.family}>
              <label
                htmlFor={id}
                className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50"
              >
                <Checkbox
                  id={id}
                  className="mt-0.5"
                  checked={selected.has(f.family)}
                  onCheckedChange={(checked) => toggle(f.family, checked)}
                  disabled={disabled}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{f.label}</span>
                    <Badge variant="outline">{f.family}</Badge>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {f.count} facture{f.count > 1 ? "s" : ""} ·{" "}
                    {formatAmount(f.totalTTC)} TTC
                  </span>
                  {f.excludedCash > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      dont {f.excludedCash} en espèces ou au comptoir, ignorée
                      {f.excludedCash > 1 ? "s" : ""}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {selected.size === 0 ? (
          <span className="text-destructive">
            Cochez au moins une famille pour lancer le rapprochement.
          </span>
        ) : (
          <>
            <strong className="text-foreground">
              {total.count} facture{total.count > 1 ? "s" : ""}
            </strong>{" "}
            cochée{total.count > 1 ? "s" : ""} ·{" "}
            <strong className="text-foreground">
              {formatAmount(total.totalTTC)} TTC
            </strong>
            {total.excludedCash > 0 &&
              ` (dont ${total.excludedCash} en espèces ou au comptoir, ignorées)`}
          </>
        )}
      </p>
    </fieldset>
  );
}
