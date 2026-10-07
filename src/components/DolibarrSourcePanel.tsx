"use client";

import { useState } from "react";
import {
  addYears,
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Database, RotateCcw } from "lucide-react";
import { Button, DatePicker, Progress, Spinner } from "@forestar-be/ui";
import type { DolibarrReadState } from "@/hooks/useDolibarrRead";

interface DolibarrSourcePanelProps {
  state: DolibarrReadState;
  /** Lance la lecture ; dates au format AAAA-MM-JJ. */
  onRead: (from: string, to: string) => void;
  /** Abandonne la lecture ou le résultat pour choisir une autre période. */
  onReset: () => void;
  disabled?: boolean;
}

const ISO_DAY = "yyyy-MM-dd";

/** Raccourcis de période : année en cours, mois précédent, année précédente. */
const PRESETS: { label: string; range: () => { start: Date; end: Date } }[] = [
  {
    label: "Année en cours",
    range: () => ({ start: startOfYear(new Date()), end: new Date() }),
  },
  {
    label: "Mois précédent",
    range: () => {
      const previous = subMonths(new Date(), 1);
      return { start: startOfMonth(previous), end: endOfMonth(previous) };
    },
  },
  {
    label: "Année précédente",
    range: () => {
      const previous = addYears(new Date(), -1);
      return { start: startOfYear(previous), end: endOfYear(previous) };
    },
  },
];

const formatDurationMs = (ms: number) =>
  ms < 1000 ? "moins d'une seconde" : `${Math.round(ms / 1000)} s`;

/**
 * Source « Dolibarr » (R003) : période (raccourcis ou dates libres), lecture des
 * factures par le serveur avec barre d'avancement, puis récapitulatif.
 */
export default function DolibarrSourcePanel({
  state,
  onRead,
  onReset,
  disabled = false,
}: DolibarrSourcePanelProps) {
  const [period, setPeriod] = useState<{ start?: Date; end?: Date }>(() =>
    PRESETS[0].range()
  );

  const periodValid =
    !!period.start && !!period.end && period.start <= period.end;
  const busy = state.status === "starting" || state.status === "running";

  if (state.status === "done") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/10 p-3">
        <div className="flex min-w-0 items-start gap-2 text-sm">
          <Database className="mt-0.5 size-4 shrink-0 text-success" />
          <p>
            <strong>
              {state.count} facture{state.count > 1 ? "s" : ""} lue
              {state.count > 1 ? "s" : ""}
            </strong>{" "}
            ({state.label}) en {formatDurationMs(state.durationMs)}.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={disabled}
        >
          <RotateCcw />
          Changer de période
        </Button>
      </div>
    );
  }

  if (busy) {
    const progress =
      state.status === "running" && state.pageCount > 0
        ? Math.round((state.pagesRead / state.pageCount) * 100)
        : null;
    return (
      <div role="status" className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Spinner size="sm" />
          Lecture des factures dans Dolibarr…
        </div>
        <Progress
          value={progress}
          aria-label="Avancement de la lecture des factures"
        />
        <p className="text-sm text-muted-foreground">
          {state.status === "running" && state.pageCount > 0
            ? `Page ${state.pagesRead} sur ${state.pageCount}. `
            : "Préparation de la lecture. "}
          Une année entière prend environ 2 minutes : vous pouvez patienter sur
          cette page, rien n&apos;est enregistré tant que vous n&apos;avez pas
          lancé le rapprochement.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Raccourcis"
      >
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => setPeriod(preset.range())}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Du</span>
          <DatePicker
            value={period.start}
            onChange={(start) => setPeriod((p) => ({ ...p, start }))}
            locale={fr}
            displayFormat="dd/MM/yyyy"
            placeholder="Date de début"
            toDate={period.end}
            disabled={disabled}
            aria-label="Début de la période"
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Au</span>
          <DatePicker
            value={period.end}
            onChange={(end) => setPeriod((p) => ({ ...p, end }))}
            locale={fr}
            displayFormat="dd/MM/yyyy"
            placeholder="Date de fin"
            fromDate={period.start}
            disabled={disabled}
            aria-label="Fin de la période"
          />
        </div>
      </div>
      <Button
        type="button"
        disabled={!periodValid || disabled}
        onClick={() =>
          period.start &&
          period.end &&
          onRead(format(period.start, ISO_DAY), format(period.end, ISO_DAY))
        }
      >
        <Database />
        Lire les factures
      </Button>
    </div>
  );
}
