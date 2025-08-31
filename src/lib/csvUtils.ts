export const validateCSVFile = (
  file: File
): { valid: boolean; message: string } => {
  // Vérification de l'extension
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { valid: false, message: "Le fichier doit être au format CSV" };
  }

  // Vérification de la taille (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return {
      valid: false,
      message: "Le fichier est trop volumineux (max 10MB)",
    };
  }

  return { valid: true, message: "Fichier valide" };
};
