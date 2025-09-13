import { useMemo } from "react";
import { DetailedReconciliationMatch } from "@/types";
import { SortConfig } from "@/components/SortSelector";

// Fonction utilitaire pour appliquer le tri (copie de useReconciliationDetail)
function applySorting(
  items: any[],
  sortConfig: SortConfig,
  getTransactionFromMatch: (match: DetailedReconciliationMatch) => any,
  getInvoiceFromMatch: (match: DetailedReconciliationMatch) => any
) {
  const sortedItems = [...items];

  sortedItems.sort((a, b) => {
    // Tri par défaut : validés toujours à la fin, reste par confiance
    if (!sortConfig.field) {
      // Séparer les validés des autres
      const aIsValidated = isValidated(a, getTransactionFromMatch);
      const bIsValidated = isValidated(b, getTransactionFromMatch);

      // Si l'un est validé et l'autre non, mettre le validé à la fin
      if (aIsValidated && !bIsValidated) return 1;
      if (!aIsValidated && bIsValidated) return -1;

      // Pour les non-validés OU les validés entre eux, trier par confiance
      const aConfidence = getConfidenceValue(a, getTransactionFromMatch);
      const bConfidence = getConfidenceValue(b, getTransactionFromMatch);

      if (sortConfig.direction === "asc") {
        return aConfidence - bConfidence;
      } else {
        return bConfidence - aConfidence;
      }
    }

    // Tri personnalisé
    let aValue: any;
    let bValue: any;

    switch (sortConfig.field) {
      case "type":
        aValue = a.sortValue || "";
        bValue = b.sortValue || "";
        break;
      case "confidence":
        aValue = getConfidenceValue(a, getTransactionFromMatch);
        bValue = getConfidenceValue(b, getTransactionFromMatch);
        break;
      case "validated":
        aValue = getValidationOrder(a, getTransactionFromMatch);
        bValue = getValidationOrder(b, getTransactionFromMatch);
        break;
      case "amount":
        aValue = getAmountValue(a, getInvoiceFromMatch);
        bValue = getAmountValue(b, getInvoiceFromMatch);
        break;
      case "date":
        aValue = getDateValue(a, getTransactionFromMatch);
        bValue = getDateValue(b, getTransactionFromMatch);
        break;
      default:
        return 0;
    }

    if (sortConfig.direction === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return sortedItems;
}

// Fonction pour vérifier si un item est validé
function isValidated(
  item: any,
  getTransactionFromMatch: (match: DetailedReconciliationMatch) => any
): boolean {
  if (item.type === "multiple") return false;
  if (!item.match) return false;

  const transaction = getTransactionFromMatch(item.match);
  if (!transaction) return false;

  return item.match.validationStatus === "VALIDATED";
}

// Fonction pour obtenir l'ordre de validation (3 = validé, 2 = en attente, 1 = rejeté, 0 = non matché)
function getValidationOrder(
  item: any,
  getTransactionFromMatch: (match: DetailedReconciliationMatch) => any
): number {
  if (item.type === "multiple") return 0;
  if (!item.match) return 0;

  const transaction = getTransactionFromMatch(item.match);
  if (!transaction) return 1; // Pas de transaction = rejeté

  if (item.match.validationStatus === "VALIDATED") return 3;
  if (item.match.validationStatus === "REJECTED") return 1;
  return 2; // En attente
}

// Fonction pour obtenir l'ordre de validation pour le tri par défaut (validés à la fin)
function getValidationOrderForDefault(
  item: any,
  getTransactionFromMatch: (match: DetailedReconciliationMatch) => any
): number {
  if (item.type === "multiple") return 0;
  if (!item.match) return 0;

  const transaction = getTransactionFromMatch(item.match);
  if (!transaction) return 2; // Pas de transaction = rejeté

  if (item.match.validationStatus === "VALIDATED") return 1; // Validé = plus bas (à la fin)
  if (item.match.validationStatus === "REJECTED") return 2; // Rejeté = milieu
  return 3; // En attente = plus haut (au début)
}

// Fonction pour obtenir la valeur de confiance
function getConfidenceValue(
  item: any,
  getTransactionFromMatch: (match: DetailedReconciliationMatch) => any
): number {
  if (item.type === "multiple") return -1;
  if (!item.match) return 0;

  const transaction = getTransactionFromMatch(item.match);
  if (item.match.isManualMatch && transaction) return 100;
  if (item.match.validationStatus === "REJECTED" || !transaction) return 0;
  if (item.match.validationStatus === "VALIDATED" && transaction) return 100;
  return item.match.confidence || 0;
}

// Fonction pour obtenir la valeur du montant
function getAmountValue(
  item: any,
  getInvoiceFromMatch: (match: DetailedReconciliationMatch) => any
): number {
  if (!item.match) return 0;
  const invoice = getInvoiceFromMatch(item.match);
  return invoice?.amount || 0;
}

// Fonction pour obtenir la valeur de date
function getDateValue(
  item: any,
  getTransactionFromMatch: (match: DetailedReconciliationMatch) => any
): string {
  if (!item.match) return "";
  const transaction = getTransactionFromMatch(item.match);
  return transaction?.date || "";
}

interface DisplayItem {
  type: "single" | "multiple";
  invoiceId: string;
  invoice: any;
  match?: DetailedReconciliationMatch;
  matches?: DetailedReconciliationMatch[];
  sortValue?: any;
}

export function useReconciliationFilters(
  matches: DetailedReconciliationMatch[],
  searchTerm: string,
  selectedFilters: string[],
  sortConfig: SortConfig,
  currentPage: number,
  itemsPerPage: number,
  getInvoiceFromMatch: (match: DetailedReconciliationMatch) => any,
  getTransactionFromMatch: (match: DetailedReconciliationMatch) => any
) {
  // D'abord regrouper toutes les correspondances par facture pour préserver le statut "multiple"
  const allGrouped = useMemo(() => {
    return matches.reduce(
      (acc, match) => {
        const invoiceId = match.invoiceId;
        if (!acc[invoiceId]) {
          acc[invoiceId] = {
            invoice: getInvoiceFromMatch(match),
            allMatches: [],
            isOriginallyMultiple: false,
          };
        }
        acc[invoiceId].allMatches.push(match);
        return acc;
      },
      {} as Record<
        string,
        {
          invoice: any;
          allMatches: DetailedReconciliationMatch[];
          isOriginallyMultiple: boolean;
        }
      >
    );
  }, [matches, getInvoiceFromMatch]);

  // Marquer les factures qui ont originellement plusieurs correspondances
  const groupedWithMultipleFlag = useMemo(() => {
    const grouped = { ...allGrouped };
    Object.keys(grouped).forEach((invoiceId) => {
      grouped[invoiceId].isOriginallyMultiple =
        grouped[invoiceId].allMatches.length > 1;
    });
    return grouped;
  }, [allGrouped]);

  // Appliquer le filtrage par terme de recherche
  const filteredGroups = useMemo(() => {
    if (!searchTerm) {
      return groupedWithMultipleFlag;
    }

    const term = searchTerm.toLowerCase();
    const filtered: typeof groupedWithMultipleFlag = {};

    Object.entries(groupedWithMultipleFlag).forEach(([invoiceId, group]) => {
      // Vérifier si la facture elle-même correspond au terme de recherche
      const invoiceMatches =
        group.invoice?.ref?.toLowerCase().includes(term) ||
        group.invoice?.tiers?.toLowerCase().includes(term);

      // Filtrer les correspondances de cette facture
      const filteredMatches = group.allMatches.filter((match) => {
        const transaction = getTransactionFromMatch(match);

        return (
          invoiceMatches ||
          transaction?.libelles?.toLowerCase().includes(term) ||
          transaction?.detailsMouvement?.toLowerCase().includes(term) ||
          match.matchType.toLowerCase().includes(term)
        );
      });

      // Pour les factures à correspondances multiples, vérifier aussi les termes génériques
      const matchesGenericMultipleTerms =
        "multiple".includes(term) || "correspondances multiples".includes(term);

      // Inclure la facture si :
      // 1. Au moins une correspondance match le terme de recherche, OU
      // 2. C'est une facture multiple et le terme correspond aux termes génériques "multiple"
      if (
        filteredMatches.length > 0 ||
        (group.isOriginallyMultiple && matchesGenericMultipleTerms)
      ) {
        filtered[invoiceId] = {
          ...group,
          // Pour les factures multiples, garder toutes les correspondances originales
          // Pour les factures simples, utiliser les correspondances filtrées
          allMatches: group.isOriginallyMultiple
            ? group.allMatches
            : filteredMatches,
        };
      }
    });

    return filtered;
  }, [groupedWithMultipleFlag, searchTerm, getTransactionFromMatch]);

  // Calculer les types de correspondances disponibles
  const availableFilterTypes = useMemo(() => {
    const types = new Set<string>();
    const allGrouped = matches.reduce(
      (acc, match) => {
        const invoiceId = match.invoiceId;
        if (!acc[invoiceId]) {
          acc[invoiceId] = [];
        }
        acc[invoiceId].push(match);
        return acc;
      },
      {} as Record<string, DetailedReconciliationMatch[]>
    );

    let hasManualMatches = false;

    Object.values(allGrouped).forEach((matches) => {
      if (matches.length > 1) {
        types.add("MULTIPLE");
      } else {
        const match = matches[0];
        if (match.isManualMatch) {
          hasManualMatches = true;
        }
        types.add(match.matchType);
      }
    });

    if (hasManualMatches) {
      types.add("MANUAL");
    }

    return Array.from(types);
  }, [matches]);

  // Créer les éléments d'affichage
  const displayItems = useMemo(() => {
    let items: DisplayItem[] = [];

    Object.entries(filteredGroups).forEach(([invoiceId, group]) => {
      // Une facture est considérée comme "multiple" si elle était originellement multiple,
      // même si le filtrage a réduit le nombre de correspondances affichées
      if (group.isOriginallyMultiple) {
        const shouldIncludeByFilter =
          selectedFilters.length === 0 ||
          selectedFilters.length === availableFilterTypes.length ||
          selectedFilters.includes("MULTIPLE");

        if (shouldIncludeByFilter) {
          items.push({
            type: "multiple",
            invoiceId,
            invoice: group.invoice,
            matches: group.allMatches,
            sortValue: "MULTIPLE",
          });
        }
      } else {
        // Facture avec une seule correspondance
        const match = group.allMatches[0];
        let shouldIncludeByFilter = false;

        if (
          selectedFilters.length === 0 ||
          selectedFilters.length === availableFilterTypes.length
        ) {
          // Aucun filtre sélectionné OU tous les filtres sélectionnés = mode "tous les types", montrer tout
          shouldIncludeByFilter = true;
        } else {
          // Vérifier si le match correspond à l'un des filtres sélectionnés
          if (match.isManualMatch && selectedFilters.includes("MANUAL")) {
            shouldIncludeByFilter = true;
          } else if (
            !match.isManualMatch &&
            selectedFilters.includes(match.matchType)
          ) {
            shouldIncludeByFilter = true;
          }
        }

        if (shouldIncludeByFilter) {
          items.push({
            type: "single",
            invoiceId,
            invoice: group.invoice,
            match: match,
            sortValue: match.isManualMatch ? "MANUAL" : match.matchType,
          });
        }
      }
    });

    // Appliquer le tri
    items = applySorting(
      items,
      sortConfig,
      getTransactionFromMatch,
      getInvoiceFromMatch
    );

    return items;
  }, [
    filteredGroups,
    selectedFilters,
    availableFilterTypes,
    searchTerm,
    getInvoiceFromMatch,
    sortConfig,
  ]);

  // Calculer le nombre total d'éléments
  const totalItemsCount = useMemo(() => {
    const allGrouped = matches.reduce(
      (acc, match) => {
        const invoiceId = match.invoiceId;
        if (!acc[invoiceId]) {
          acc[invoiceId] = [];
        }
        acc[invoiceId].push(match);
        return acc;
      },
      {} as Record<string, DetailedReconciliationMatch[]>
    );

    return Object.keys(allGrouped).length;
  }, [matches]);

  // Calculer les compteurs pour chaque type de filtre (basé sur tous les groupes, pas seulement filtrés)
  const filterTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    availableFilterTypes.forEach((type) => {
      let count = 0;
      Object.entries(groupedWithMultipleFlag).forEach(([invoiceId, group]) => {
        if (group.isOriginallyMultiple) {
          if (type === "MULTIPLE") {
            count++;
          }
        } else {
          const match = group.allMatches[0];
          if (type === "MANUAL" && match.isManualMatch) {
            count++;
          } else if (
            type !== "MULTIPLE" &&
            type !== "MANUAL" &&
            !match.isManualMatch &&
            match.matchType === type
          ) {
            count++;
          }
        }
      });

      counts[type] = count;
    });

    return counts;
  }, [availableFilterTypes, groupedWithMultipleFlag]);

  // Calculer la pagination
  const paginationData = useMemo(() => {
    const totalItems = displayItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = displayItems.slice(startIndex, endIndex);

    return { totalItems, totalPages, startIndex, endIndex, paginatedItems };
  }, [displayItems, itemsPerPage, currentPage]);

  return {
    displayItems,
    availableFilterTypes,
    totalItemsCount,
    filterTypeCounts,
    paginationData,
  };
}
