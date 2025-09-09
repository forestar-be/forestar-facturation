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

export const getMatchTypeColor = (
  matchType: string,
  validationStatus?: string,
  isManualMatch?: boolean
) => {
  // Si c'est une correspondance manuelle, afficher en violet
  if (isManualMatch) {
    return "bg-purple-100 text-purple-800";
  }

  // Si c'est validé, afficher en vert foncé
  if (validationStatus === "VALIDATED") {
    return "bg-emerald-100 text-emerald-800";
  }

  // Si c'est rejeté, afficher en rouge foncé
  if (validationStatus === "REJECTED") {
    return "bg-rose-100 text-rose-800";
  }

  // Sinon, afficher la couleur normale du type de correspondance
  switch (matchType) {
    case "EXACT_REF":
      return "bg-green-100 text-green-800";
    case "EXACT_AMOUNT":
      return "bg-blue-100 text-blue-800";
    case "REFINED_AMOUNT":
      return "bg-teal-100 text-teal-800";
    case "SIMPLE_NAME":
      return "bg-indigo-100 text-indigo-800";
    case "FUZZY_NAME":
      return "bg-yellow-100 text-yellow-800";
    case "COMBINED":
      return "bg-purple-100 text-purple-800";
    case "NONE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
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
