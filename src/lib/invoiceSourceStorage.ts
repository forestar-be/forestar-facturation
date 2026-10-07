// Choix de la source des factures, mémorisé dans le navigateur (R003).

export type InvoiceSource = "csv" | "dolibarr";

const STORAGE_KEY = "facturation_invoice_source";

/** Par défaut : Dolibarr, le CSV restant le secours. */
export const DEFAULT_INVOICE_SOURCE: InvoiceSource = "dolibarr";

export const InvoiceSourceStorage = {
  get: (): InvoiceSource => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "csv" || stored === "dolibarr"
        ? stored
        : DEFAULT_INVOICE_SOURCE;
    } catch {
      // Stockage indisponible (navigation privée, données bloquées).
      return DEFAULT_INVOICE_SOURCE;
    }
  },

  set: (source: InvoiceSource) => {
    try {
      localStorage.setItem(STORAGE_KEY, source);
    } catch {
      // Sans stockage, le choix vaut pour la session seulement.
    }
  },
};
