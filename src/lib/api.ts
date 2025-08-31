// Service API pour les appels au backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Récupère le token d'authentification depuis le localStorage
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("facturation_token");
};

// Headers par défaut avec authentification
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
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

    const token = getAuthToken();
    const response = await fetch(`${API_URL}/facturation/upload`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Erreur inconnue" }));
      throw new Error(errorData.message || "Erreur lors de l'upload");
    }

    const data = await response.json();
    return {
      success: data.success,
      reconciliationId: data.reconciliationId,
      message: data.message,
    };
  } catch (error) {
    console.error("Erreur upload:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erreur lors de l'upload des fichiers",
    };
  }
};

// Récupère le statut d'une réconciliation
export const getReconciliationStatus = async (
  reconciliationId: string
): Promise<{
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
  progress: number;
  invoicesCount?: number;
  transactionsCount?: number;
  startTime?: number;
  endTime?: number;
  error?: string;
} | null> => {
  try {
    const response = await fetch(
      `${API_URL}/facturation/reconciliation/${reconciliationId}/status`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Erreur lors de la récupération du statut");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur statut:", error);
    return null;
  }
};

// Récupère le résultat d'une réconciliation
export const getReconciliationResult = async (
  reconciliationId: string
): Promise<any | null> => {
  try {
    const response = await fetch(
      `${API_URL}/facturation/reconciliation/${reconciliationId}/result`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Erreur lors de la récupération du résultat");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur résultat:", error);
    return null;
  }
};

// Polling pour suivre l'évolution d'une réconciliation
export const pollReconciliationStatus = (
  reconciliationId: string,
  onStatusUpdate: (status: any) => void,
  onComplete: (result: any) => void,
  onError: (error: string) => void
) => {
  const poll = async () => {
    try {
      const status = await getReconciliationStatus(reconciliationId);

      if (!status) {
        onError("Réconciliation non trouvée");
        return;
      }

      onStatusUpdate(status);

      if (status.status === "COMPLETED") {
        const result = await getReconciliationResult(reconciliationId);
        if (result) {
          onComplete(result);
        }
        return;
      }

      if (status.status === "ERROR") {
        onError(status.error || "Erreur lors de la réconciliation");
        return;
      }

      // Continue le polling si en cours
      if (status.status === "PENDING" || status.status === "PROCESSING") {
        setTimeout(poll, 5000); // Poll toutes les 5 secondes pour réduire la charge
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Erreur lors du suivi");
    }
  };

  // Démarrage du polling
  poll();
};

// Version Promise pour un usage plus simple
export const pollReconciliationStatusAsync = async (
  reconciliationId: string,
  onProgress?: (status: {
    status: string;
    progress?: number;
    message?: string;
  }) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    pollReconciliationStatus(
      reconciliationId,
      (status) => {
        if (onProgress) {
          onProgress({
            status: status.status.toLowerCase(),
            progress: status.progress,
            message: getStatusMessage(status),
          });
        }
      },
      (result) => resolve(result),
      (error) => reject(new Error(error))
    );
  });
};

// Helper pour convertir le statut en message
const getStatusMessage = (status: any): string => {
  switch (status.status) {
    case "PENDING":
      return "En attente de traitement...";
    case "PROCESSING":
      return `Traitement en cours... (${status.progress || 0}%)`;
    case "COMPLETED":
      return "Réconciliation terminée";
    case "ERROR":
      return status.error || "Erreur lors de la réconciliation";
    default:
      return "Statut inconnu";
  }
};

// Télécharger le fichier XLSX de réconciliation
export const downloadReconciliationFile = async (
  downloadUrl: string,
  fileName: string
) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}${downloadUrl}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors du téléchargement du fichier");
    }

    // Créer un blob à partir de la réponse
    const blob = await response.blob();

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
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erreur lors du téléchargement",
    };
  }
};
