"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDolibarrRead, startDolibarrRead } from "@/lib/api";
import type { InvoiceFamilySummary } from "@/types";

/** Intervalle d'interrogation du serveur pendant la lecture (une année ≈ 2 min). */
const POLL_INTERVAL_MS = 2000;

export type DolibarrReadState =
  | { status: "idle" }
  | { status: "starting" }
  | {
      status: "running";
      sourceId: string;
      pagesRead: number;
      pageCount: number;
    }
  | {
      status: "done";
      sourceId: string;
      label: string;
      count: number;
      durationMs: number;
      families: InvoiceFamilySummary[];
    };

/**
 * Lecture des factures d'une période dans Dolibarr (R003) : lance la tâche de
 * fond du serveur puis l'interroge toutes les 2 s jusqu'à la fin. En cas
 * d'échec (période refusée, Dolibarr injoignable, lecture expirée), l'état
 * revient à `idle` et `onFailure` reçoit le message du serveur.
 */
export function useDolibarrRead(onFailure: (message: string) => void) {
  const [state, setState] = useState<DolibarrReadState>({ status: "idle" });
  // Numéro de la lecture en cours : une réponse tardive d'une lecture
  // abandonnée est ignorée.
  const runRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFailureRef = useRef(onFailure);

  useEffect(() => {
    onFailureRef.current = onFailure;
  }, [onFailure]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Arrêt du suivi au démontage.
  useEffect(() => {
    return () => {
      runRef.current += 1;
      stopTimer();
    };
  }, []);

  const reset = useCallback(() => {
    runRef.current += 1;
    stopTimer();
    setState({ status: "idle" });
  }, []);

  const fail = (message: string) => {
    runRef.current += 1;
    stopTimer();
    setState({ status: "idle" });
    onFailureRef.current(message);
  };

  const poll = (sourceId: string, runId: number) => {
    timerRef.current = setTimeout(async () => {
      const result = await getDolibarrRead(sourceId);
      if (runId !== runRef.current) return;

      if (!result.ok) return fail(result.message);

      const { read } = result;
      if (read.status === "error") return fail(read.message);
      if (read.status === "done") {
        setState({
          status: "done",
          sourceId,
          label: read.label,
          count: read.count,
          durationMs: read.durationMs,
          families: read.families,
        });
        return;
      }
      setState({
        status: "running",
        sourceId,
        pagesRead: read.pagesRead ?? 0,
        pageCount: read.pageCount ?? 0,
      });
      poll(sourceId, runId);
    }, POLL_INTERVAL_MS);
  };

  const start = async (from: string, to: string) => {
    const runId = ++runRef.current;
    stopTimer();
    setState({ status: "starting" });
    const started = await startDolibarrRead(from, to);
    if (runId !== runRef.current) return;
    if (!started.ok) return fail(started.message);
    setState({
      status: "running",
      sourceId: started.sourceId,
      pagesRead: 0,
      pageCount: 0,
    });
    poll(started.sourceId, runId);
  };

  return { state, start, reset };
}
