import * as XLSX from "xlsx";
import {
  DetailedReconciliationMatch,
  DetailedInvoice,
  DetailedBankTransaction,
} from "@/types";
import { getMatchTypeLabel } from "@/lib/reconciliationUtils";

interface DisplayItem {
  type: "single" | "multiple";
  invoiceId: string;
  invoice: any;
  match?: DetailedReconciliationMatch;
  matches?: DetailedReconciliationMatch[];
  sortValue?: any;
}

interface ExportData {
  allDisplayItems: DisplayItem[];
  reconciliationId: string;
  reconciliationName: string;
  reconciliationDate?: string; // Date de création de la réconciliation
  getTransactionFromMatch: (
    match: DetailedReconciliationMatch
  ) => DetailedBankTransaction | undefined;
  searchTerm?: string;
  selectedFilters?: string[];
  sortField?: string | null;
  sortDirection?: "asc" | "desc";
}

interface ExportProgress {
  onProgress?: (progress: number, step: string) => void;
}

export async function exportToExcel(
  data: ExportData,
  options: ExportProgress = {}
): Promise<void> {
  const { onProgress } = options;

  try {
    onProgress?.(10, "Préparation des données...");

    // Créer un nouveau classeur
    const workbook = XLSX.utils.book_new();

    // Préparer les données pour l'export
    const excelData: any[] = [];

    onProgress?.(20, "Traitement des correspondances...");

    let processedItems = 0;
    const totalItems = data.allDisplayItems.length;

    for (const item of data.allDisplayItems) {
      if (item.type === "multiple") {
        // Pour les correspondances multiples, créer UNE SEULE ligne avec les valeurs concaténées
        const invoice = item.invoice;
        const matches = item.matches || [];

        // Récupérer toutes les transactions et leurs détails
        const transactions = matches.map((match) =>
          data.getTransactionFromMatch(match)
        );

        // Concaténer les libellés de transaction
        const libelles = transactions
          .map((t) => t?.libelles || "Aucune transaction")
          .join(" | OU | ");

        // Concaténer les montants de transaction
        const montants = transactions
          .map((t) => (t?.montant ? `${t.montant.toFixed(2)} €` : "0 €"))
          .join(" | OU | ");

        // Concaténer les dates de transaction
        const dates = transactions
          .map((t) => t?.dateComptable || "N/A")
          .join(" | OU | ");

        // Concaténer les détails de mouvement
        const details = transactions
          .map((t) => t?.detailsMouvement || "N/A")
          .join(" | OU | ");

        // Concaténer toutes les notes
        const allNotes = matches
          .map((match) => match.notes?.join("; ") || "")
          .filter((note) => note.length > 0)
          .join(" | ");

        excelData.push({
          "Référence Facture": invoice?.ref || "N/A",
          Client: invoice?.tiers || "N/A",
          "Montant Facture (€)": invoice?.montantTTC
            ? Number(invoice.montantTTC.toFixed(2))
            : 0,
          "Date Facturation": invoice?.dateFacturation || "N/A",
          "Libellé Transaction": libelles,
          "Montant Transaction (€)": montants,
          "Date Transaction": dates,
          "Détails Transaction": details,
          Notes: allNotes,
          "Type de Correspondance": "Multiple",
          "Confiance (%)": "Variable",
        });
      } else {
        // Pour les correspondances simples
        const match = item.match!;
        const invoice = item.invoice;
        const transaction = data.getTransactionFromMatch(match);

        let confidence = 0;
        if (match.isManualMatch && transaction) {
          confidence = 100;
        } else if (match.validationStatus === "VALIDATED" && transaction) {
          confidence = 100;
        } else if (match.validationStatus === "REJECTED" || !transaction) {
          confidence = 0;
        } else {
          confidence = match.confidence;
        }

        excelData.push({
          "Référence Facture": invoice?.ref || "N/A",
          Client: invoice?.tiers || "N/A",
          "Montant Facture (€)": invoice?.montantTTC
            ? Number(invoice.montantTTC.toFixed(2))
            : 0,
          "Date Facturation": invoice?.dateFacturation || "N/A",
          "Libellé Transaction": transaction?.libelles || "Aucune transaction",
          "Montant Transaction (€)": transaction?.montant
            ? Number(transaction.montant.toFixed(2))
            : 0,
          "Date Transaction": transaction?.dateComptable || "N/A",
          "Détails Transaction": transaction?.detailsMouvement || "N/A",
          Notes: match.notes?.join("; ") || "",
          "Type de Correspondance": getMatchTypeLabel(
            match.matchType,
            match.validationStatus,
            match.isManualMatch
          ),
          "Confiance (%)": Number(confidence.toFixed(0)),
        });
      }

      processedItems++;
      const progress = Math.round(20 + (processedItems / totalItems) * 60);
      onProgress?.(
        progress,
        `Traitement des correspondances... (${processedItems}/${totalItems})`
      );
    }

    onProgress?.(85, "Création du fichier Excel...");

    // Créer la feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Définir la largeur des colonnes
    const columnWidths = [
      { wch: 20 }, // Référence Facture
      { wch: 30 }, // Client
      { wch: 15 }, // Montant Facture
      { wch: 15 }, // Date Facturation
      { wch: 60 }, // Libellé Transaction (élargi pour les valeurs concaténées)
      { wch: 30 }, // Montant Transaction (élargi pour les valeurs concaténées)
      { wch: 30 }, // Date Transaction (élargi pour les valeurs concaténées)
      { wch: 60 }, // Détails Transaction (élargi pour les valeurs concaténées)
      { wch: 60 }, // Notes (élargi pour les valeurs concaténées)
      { wch: 20 }, // Type de Correspondance
      { wch: 12 }, // Confiance
    ];

    worksheet["!cols"] = columnWidths;

    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(workbook, worksheet, "Correspondances");

    // Créer une feuille d'informations sur l'export
    const exportInfo = [
      { Propriété: "ID Réconciliation", Valeur: data.reconciliationId },
      { Propriété: "Nom", Valeur: data.reconciliationName },
      {
        Propriété: "Date d'export",
        Valeur: new Date().toLocaleString("fr-FR"),
      },
      { Propriété: "Nombre total d'éléments", Valeur: excelData.length },
      { Propriété: "Terme de recherche", Valeur: data.searchTerm || "Aucun" },
      {
        Propriété: "Filtres appliqués",
        Valeur: data.selectedFilters?.length
          ? data.selectedFilters.join(", ")
          : "Aucun",
      },
      {
        Propriété: "Tri appliqué",
        Valeur: data.sortField
          ? `${data.sortField} (${data.sortDirection})`
          : "Aucun",
      },
    ];

    const infoWorksheet = XLSX.utils.json_to_sheet(exportInfo);
    infoWorksheet["!cols"] = [{ wch: 25 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(
      workbook,
      infoWorksheet,
      "Informations Export"
    );

    onProgress?.(95, "Finalisation du téléchargement...");

    // Générer le nom du fichier en français avec date et heure
    const reconciliationDateTime = data.reconciliationDate
      ? new Date(data.reconciliationDate)
      : new Date();

    const dateStr = reconciliationDateTime
      .toLocaleDateString("fr-FR")
      .replace(/\//g, "-");
    const timeStr = reconciliationDateTime
      .toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/:/g, "h");

    const filterSuffix =
      data.searchTerm || data.selectedFilters?.length ? "_avec_filtres" : "";
    const fileName = `Réconciliation_${dateStr}_${timeStr}${filterSuffix}.xlsx`;

    // Écrire et télécharger le fichier
    XLSX.writeFile(workbook, fileName);

    onProgress?.(100, "Export terminé !");
  } catch (error) {
    console.error("Erreur lors de l'export Excel:", error);
    throw new Error("Erreur lors de la génération du fichier Excel");
  }
}
