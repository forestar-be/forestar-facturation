// Service API pour les appels au backend
import {
  ReconciliationSummary,
  ReconciliationDetails,
  MatchUpdateRequest,
  MatchCreateRequest,
  MatchValidationRequest,
  MatchSuggestion,
  MultipleResolutionRequest,
  MatchModificationResult,
  DetailedReconciliationMatch,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class HttpError extends Error {
  constructor(
    public message: string,
    public status: number
  ) {
    super(message);
    this.name = "HttpError";

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const isHttpError = (error: any): error is HttpError => {
  return error && error.name === "HttpError";
};

// Récupère le token d'authentification depuis le localStorage
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("facturation_token");
};

const apiRequest = async (
  endpoint: string,
  method: string,
  token?: string,
  body?: any,
  additionalHeaders: HeadersInit = { "Content-Type": "application/json" },
  stringifyBody: boolean = true
) => {
  const authToken = token || getAuthToken();

  const headers: HeadersInit = {
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...additionalHeaders,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = stringifyBody ? JSON.stringify(body) : body;
  }

  const response: Response = await fetch(`${API_URL}${endpoint}`, options);

  let data;

  try {
    // Check if the response is a binary type
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else if (contentType && contentType.includes("text/html")) {
      data = await response.text();
    } else {
      data = await response.blob();
    }
  } catch (error) {
    console.warn("Error parsing response", response, error);
  }

  if (
    response.status === 403 &&
    data?.message &&
    data?.message === "jwt expired"
  ) {
    window.location.href = `/connexion?redirect=${window.location.pathname}`;
  }

  if (!response.ok) {
    console.error(`${response.statusText} ${response.status}`, data);
    if (typeof data === "string" && data) {
      throw new HttpError(data, response.status);
    }
    throw new HttpError(
      data?.message || `${response.statusText} ${response.status}`,
      response.status
    );
  }

  return data;
};

// Upload des fichiers et démarrage de la réconciliation
export const uploadFiles = async (
  invoicesFile: File,
  transactionsFile: File
): Promise<{
  success: boolean;
  reconciliationId?: string;
  message: string;
}> => {
  try {
    const formData = new FormData();
    formData.append("invoices", invoicesFile);
    formData.append("transactions", transactionsFile);

    const data = await apiRequest(
      "/facturation/upload",
      "POST",
      undefined,
      formData,
      {}, // No content-type header, browser will set it with boundary
      false // Don't stringify the body
    );

    return {
      success: data.success,
      reconciliationId: data.reconciliationId,
      message: data.message,
    };
  } catch (error) {
    console.error("Erreur upload:", error);
    if (isHttpError(error)) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: false,
      message: "Erreur lors de l'upload des fichiers",
    };
  }
};

// Récupère le statut d'une réconciliation
export const getReconciliationStatus = async (
  reconciliationId: string
): Promise<{
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
  progress: number;
  message?: string;
  invoicesCount?: number;
  transactionsCount?: number;
  startTime?: number;
  endTime?: number;
  error?: string;
} | null> => {
  try {
    return await apiRequest(
      `/facturation/reconciliation/${reconciliationId}/status`,
      "GET"
    );
  } catch (error) {
    console.error("Erreur statut:", error);
    if (isHttpError(error) && error.status === 404) {
      return null;
    }
    return null;
  }
};

// Récupère le résultat d'une réconciliation
export const getReconciliationResult = async (
  reconciliationId: string
): Promise<any | null> => {
  try {
    return await apiRequest(
      `/facturation/reconciliation/${reconciliationId}/result`,
      "GET"
    );
  } catch (error) {
    console.error("Erreur résultat:", error);
    if (isHttpError(error) && error.status === 404) {
      return null;
    }
    return null;
  }
};

// Helper pour convertir le statut en message
export const getStatusMessage = (status: any): string => {
  // Message de base généré par le frontend
  let baseMessage = "";
  switch (status.status) {
    case "PENDING":
      baseMessage = "En attente de traitement...";
      break;
    case "PROCESSING":
      baseMessage = `Traitement en cours... (${status.progress || 0}%)`;
      break;
    case "COMPLETED":
      baseMessage = "Réconciliation terminée";
      break;
    case "ERROR":
      baseMessage = status.error || "Erreur lors de la réconciliation";
      break;
    default:
      baseMessage = "Statut inconnu";
      break;
  }

  // Si le backend envoie un message, l'utiliser en priorité
  return status.message || baseMessage;
};

// Télécharger le fichier XLSX de réconciliation
export const downloadReconciliationFile = async (
  downloadUrl: string,
  fileName: string
) => {
  try {
    // Créer un blob à partir de la réponse
    const blob = await apiRequest(downloadUrl, "GET");

    // Créer un lien de téléchargement temporaire
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";

    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();

    // Nettoyer
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Erreur téléchargement:", error);
    if (isHttpError(error)) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: false,
      message: "Erreur lors du téléchargement",
    };
  }
};

// === NOUVELLES FONCTIONS POUR LE SYSTÈME DE GESTION ===

// Récupérer toutes les réconciliations
export const getAllReconciliations = async (): Promise<
  ReconciliationSummary[]
> => {
  try {
    return await apiRequest("/facturation/reconciliations", "GET");
  } catch (error) {
    console.error("Erreur réconciliations:", error);
    return [];
  }
};

// Récupérer les détails d'une réconciliation
export const getReconciliationDetails = async (
  reconciliationId: string
): Promise<ReconciliationDetails | null> => {
  try {
    return await apiRequest(
      `/facturation/reconciliations/${reconciliationId}`,
      "GET"
    );
  } catch (error) {
    console.error("Erreur détails réconciliation:", error);
    if (isHttpError(error) && error.status === 404) {
      return null;
    }
    return null;
  }
};

// === NOUVELLES FONCTIONS POUR LA MODIFICATION DES CORRESPONDANCES ===

// Modifier une correspondance existante
export const updateMatch = async (
  reconciliationId: string,
  matchId: string,
  updateData: MatchUpdateRequest
): Promise<DetailedReconciliationMatch | null> => {
  try {
    return await apiRequest(
      `/facturation/reconciliations/${reconciliationId}/matches/${matchId}`,
      "PUT",
      undefined,
      updateData
    );
  } catch (error) {
    console.error("Erreur modification correspondance:", error);
    return null;
  }
};

// Créer une nouvelle correspondance manuelle
export const createMatch = async (
  reconciliationId: string,
  createData: MatchCreateRequest
): Promise<DetailedReconciliationMatch | null> => {
  try {
    return await apiRequest(
      `/facturation/reconciliations/${reconciliationId}/matches`,
      "POST",
      undefined,
      createData
    );
  } catch (error) {
    console.error("Erreur création correspondance:", error);
    return null;
  }
};

// Supprimer une correspondance
export const deleteMatch = async (
  reconciliationId: string,
  matchId: string
): Promise<boolean> => {
  try {
    await apiRequest(
      `/facturation/reconciliations/${reconciliationId}/matches/${matchId}`,
      "DELETE"
    );
    return true;
  } catch (error) {
    console.error("Erreur suppression correspondance:", error);
    return false;
  }
};

// Obtenir des suggestions pour une facture
export const getMatchSuggestions = async (
  reconciliationId: string,
  invoiceId?: string
): Promise<MatchSuggestion[]> => {
  try {
    let endpoint = `/facturation/reconciliations/${reconciliationId}/suggestions`;
    if (invoiceId) {
      endpoint += `?invoiceId=${invoiceId}`;
    }

    return await apiRequest(endpoint, "GET");
  } catch (error) {
    console.error("Erreur suggestions:", error);
    return [];
  }
};

// Résoudre les correspondances multiples
export const resolveMultipleMatches = async (
  reconciliationId: string,
  resolutionData: MultipleResolutionRequest
): Promise<{ results: MatchModificationResult[] } | null> => {
  try {
    return await apiRequest(
      `/facturation/reconciliations/${reconciliationId}/resolve-multiple`,
      "POST",
      undefined,
      resolutionData
    );
  } catch (error) {
    console.error("Erreur résolution multiples:", error);
    return null;
  }
};

// Valider une correspondance
export const validateMatch = async (
  reconciliationId: string,
  matchId: string,
  notes?: string[]
): Promise<DetailedReconciliationMatch | null> => {
  try {
    const updateData: MatchValidationRequest = {
      action: "validate",
      notes: notes,
    };

    return await apiRequest(
      `/facturation/reconciliations/${reconciliationId}/matches/${matchId}/validate`,
      "POST",
      undefined,
      updateData
    );
  } catch (error) {
    console.error("Erreur validation correspondance:", error);
    return null;
  }
};

// Rejeter une correspondance
export const rejectMatch = async (
  reconciliationId: string,
  matchId: string,
  notes?: string[]
): Promise<DetailedReconciliationMatch | null> => {
  try {
    const updateData: MatchValidationRequest = {
      action: "reject",
      notes: notes,
    };

    return await apiRequest(
      `/facturation/reconciliations/${reconciliationId}/matches/${matchId}/reject`,
      "POST",
      undefined,
      updateData
    );
  } catch (error) {
    console.error("Erreur rejet correspondance:", error);
    return null;
  }
};

// Supprimer une réconciliation
export const deleteReconciliation = async (
  reconciliationId: string
): Promise<boolean> => {
  try {
    await apiRequest(
      `/facturation/reconciliations/${reconciliationId}`,
      "DELETE"
    );
    return true;
  } catch (error) {
    console.error("Erreur suppression réconciliation:", error);
    return false;
  }
};

// Mettre à jour le titre d'une réconciliation
export const updateReconciliationTitle = async (
  reconciliationId: string,
  title: string
): Promise<boolean> => {
  try {
    await apiRequest(
      `/facturation/reconciliations/${reconciliationId}/title`,
      "PUT",
      undefined,
      { title }
    );
    return true;
  } catch (error) {
    console.error("Erreur mise à jour titre:", error);
    return false;
  }
};
