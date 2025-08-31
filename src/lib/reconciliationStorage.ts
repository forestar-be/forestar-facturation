// Service pour gérer l'état des réconciliations en localStorage

interface ReconciliationState {
  reconciliationId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
  progress: number;
  message?: string;
  startTime: number;
  endTime?: number;
}

const STORAGE_KEY = "facturation_reconciliation_state";

export const ReconciliationStorage = {
  // Sauvegarder l'état d'une réconciliation
  saveState: (state: ReconciliationState) => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error(
        "Erreur lors de la sauvegarde de l'état de réconciliation:",
        error
      );
    }
  },

  // Récupérer l'état d'une réconciliation
  getState: (): ReconciliationState | null => {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const state = JSON.parse(stored) as ReconciliationState;

      // Vérifier si l'état est encore valide (pas trop ancien)
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24h

      if (now - state.startTime > maxAge) {
        // État trop ancien, le supprimer
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return state;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'état de réconciliation:",
        error
      );
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },

  // Supprimer l'état d'une réconciliation
  clearState: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  },

  // Vérifier s'il y a une réconciliation en cours
  hasActiveReconciliation: (): boolean => {
    const state = ReconciliationStorage.getState();
    return (
      state !== null &&
      (state.status === "PENDING" || state.status === "PROCESSING")
    );
  },

  // Mettre à jour le statut d'une réconciliation existante
  updateStatus: (
    status: ReconciliationState["status"],
    progress: number,
    message?: string
  ) => {
    const currentState = ReconciliationStorage.getState();
    if (!currentState) return;

    const updatedState: ReconciliationState = {
      ...currentState,
      status,
      progress,
      message,
      ...(status === "COMPLETED" || status === "ERROR"
        ? { endTime: Date.now() }
        : {}),
    };

    ReconciliationStorage.saveState(updatedState);
  },
};
