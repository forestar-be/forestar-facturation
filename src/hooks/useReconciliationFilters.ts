import { useMemo } from "react";
import { DetailedReconciliationMatch } from "@/types";

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
  sortField: string | null,
  sortDirection: "asc" | "desc",
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
    if (sortField) {
      items = [...items].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case "type":
            aValue = a.sortValue;
            bValue = b.sortValue;
            break;
          case "confidence":
            if (a.type === "multiple") {
              aValue = -1;
            } else {
              // Si pas de transaction associée, confiance = 0 (même pour les correspondances manuelles)
              const aTransaction = a.match
                ? getTransactionFromMatch(a.match)
                : null;
              if (a.match?.isManualMatch && aTransaction) {
                aValue = 100;
              } else if (
                a.match?.validationStatus === "REJECTED" ||
                !aTransaction
              ) {
                aValue = 0;
              } else if (
                a.match?.validationStatus === "VALIDATED" &&
                aTransaction
              ) {
                aValue = 100;
              } else {
                aValue = a.match?.confidence || 0;
              }
            }

            if (b.type === "multiple") {
              bValue = -1;
            } else {
              // Si pas de transaction associée, confiance = 0 (même pour les correspondances manuelles)
              const bTransaction = b.match
                ? getTransactionFromMatch(b.match)
                : null;
              if (b.match?.isManualMatch && bTransaction) {
                bValue = 100;
              } else if (
                b.match?.validationStatus === "REJECTED" ||
                !bTransaction
              ) {
                bValue = 0;
              } else if (
                b.match?.validationStatus === "VALIDATED" &&
                bTransaction
              ) {
                bValue = 100;
              } else {
                bValue = b.match?.confidence || 0;
              }
            }
            break;
          default:
            return 0;
        }

        if (sortDirection === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return items;
  }, [
    filteredGroups,
    selectedFilters,
    availableFilterTypes,
    searchTerm,
    getInvoiceFromMatch,
    sortField,
    sortDirection,
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
