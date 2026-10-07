import type { StatusTone } from "@forestar-be/ui";

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Terminée";
    case "ERROR":
      return "Erreur";
    case "PROCESSING":
      return "En cours";
    case "PENDING":
      return "En attente";
    default:
      return "Inconnu";
  }
};

export const getMatchTypeLabel = (
  matchType: string,
  validationStatus?: string,
  isManualMatch?: boolean
) => {
  // Si c'est une correspondance manuelle, afficher "Manuel" en priorité
  if (isManualMatch) {
    return "Manuel";
  }

  // Si c'est validé ou rejeté, afficher le statut de validation
  if (validationStatus === "VALIDATED") {
    return "Validé";
  }
  if (validationStatus === "REJECTED") {
    return "Rejeté";
  }

  // Sinon, afficher le type de correspondance normal
  switch (matchType) {
    case "EXACT_REF":
      return "Référence exacte";
    case "EXACT_AMOUNT":
      return "Montant exact";
    case "REFINED_AMOUNT":
      return "Montant raffiné";
    case "SIMPLE_NAME":
      return "Nom exact";
    case "FUZZY_NAME":
      return "Nom approchant";
    case "COMBINED":
      return "Combiné";
    case "NONE":
      return "Non appariée";
    default:
      return "Inconnu";
  }
};

// Nouvelle fonction pour obtenir uniquement le type de correspondance
export const getMatchTypeOnly = (
  matchType: string,
  isManualMatch?: boolean
) => {
  if (isManualMatch) {
    return "Manuel";
  }

  switch (matchType) {
    case "EXACT_REF":
      return "Référence exacte";
    case "EXACT_AMOUNT":
      return "Montant exact";
    case "REFINED_AMOUNT":
      return "Montant raffiné";
    case "SIMPLE_NAME":
      return "Nom exact";
    case "FUZZY_NAME":
      return "Nom approchant";
    case "COMBINED":
      return "Combiné";
    case "NONE":
      return "Non appariée";
    default:
      return "Inconnu";
  }
};

// Nouvelle fonction pour obtenir uniquement le statut de validation
export const getValidationStatusLabel = (validationStatus?: string) => {
  switch (validationStatus) {
    case "VALIDATED":
      return "Validé";
    case "REJECTED":
      return "Rejeté";
    case "PENDING":
      return "En attente";
    default:
      return "En attente";
  }
};

/** Intention d'un statut de réconciliation, pour `StatusBadge`. */
export const getStatusTone = (status: string): StatusTone => {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "ERROR":
      return "danger";
    case "PROCESSING":
      return "info";
    case "PENDING":
      return "warning";
    default:
      return "neutral";
  }
};

/** Intention du statut de validation d'une correspondance. */
export const getValidationStatusTone = (
  validationStatus?: string
): StatusTone => {
  switch (validationStatus) {
    case "VALIDATED":
      return "success";
    case "REJECTED":
      return "danger";
    default:
      return "warning";
  }
};

/**
 * Intention du type de correspondance : plus l'algorithme est sûr, plus la
 * teinte est franche. Une correspondance manuelle est un choix de la personne,
 * pas un score : elle reste neutre.
 */
export const getMatchTypeTone = (
  matchType: string,
  isManualMatch?: boolean
): StatusTone => {
  if (isManualMatch) return "neutral";

  switch (matchType) {
    case "EXACT_REF":
      return "success";
    case "EXACT_AMOUNT":
    case "REFINED_AMOUNT":
    case "SIMPLE_NAME":
      return "info";
    case "FUZZY_NAME":
      return "warning";
    case "NONE":
      return "danger";
    default:
      return "neutral";
  }
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDuration = (startTime: string, endTime?: string) => {
  if (!endTime) return "-";

  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = Math.round((end.getTime() - start.getTime()) / 1000);

  if (duration < 60) {
    return `${duration}s`;
  } else if (duration < 3600) {
    return `${Math.round(duration / 60)}min`;
  } else {
    return `${Math.round(duration / 3600)}h`;
  }
};

// Capitalise la première lettre d'une chaîne
export const capitalizeFirstLetter = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Formate le titre d'affichage d'une réconciliation
export const getReconciliationDisplayTitle = (
  title?: string,
  createdAt?: string
) => {
  if (title && title.trim()) {
    return capitalizeFirstLetter(title.trim());
  }

  if (createdAt) {
    return `Réconciliation du ${formatDate(createdAt)}`;
  }

  return "Réconciliation";
};

export interface ConfidenceDisplay {
  percent: number;
  tone: "primary" | "success" | "warning" | "danger";
  label: string;
}

/**
 * Niveau de confiance affiché d'une correspondance : une correspondance
 * manuelle ou validée vaut 100 %, une rejetée 0 %, les autres leur score
 * (vert à partir de 80, jaune à partir de 50, rouge en dessous).
 *
 * `hasTransaction` à `false` donne 0 % à une correspondance non manuelle et non
 * rejetée : sans transaction, il n'y a rien à valider.
 */
export const getConfidenceDisplay = (
  match: {
    isManualMatch: boolean;
    validationStatus?: string;
    confidence: number;
  },
  hasTransaction: boolean
): ConfidenceDisplay => {
  if (match.isManualMatch && hasTransaction) {
    return { percent: 100, tone: "primary", label: "100%" };
  }
  if (match.validationStatus === "VALIDATED" && hasTransaction) {
    return { percent: 100, tone: "success", label: "100%" };
  }
  if (match.validationStatus === "REJECTED" || !hasTransaction) {
    return { percent: 0, tone: "danger", label: "0%" };
  }
  return {
    percent: match.confidence,
    tone:
      match.confidence >= 80
        ? "success"
        : match.confidence >= 50
          ? "warning"
          : "danger",
    label: `${match.confidence.toFixed(0)}%`,
  };
};
