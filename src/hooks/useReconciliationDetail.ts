import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  getReconciliationDetails,
  updateMatch,
  deleteMatch,
  createMatch,
  validateMatch,
  rejectMatch,
} from "@/lib/api";
import { ReconciliationDetails, DetailedReconciliationMatch } from "@/types";
import { exportToExcel } from "@/lib/excelExport";

export function useReconciliationDetail(reconciliationId: string) {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const router = useRouter();

  const [reconciliation, setReconciliation] =
    useState<ReconciliationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // États pour les modals
  const [selectedMatch, setSelectedMatch] =
    useState<DetailedReconciliationMatch | null>(null);
  const [showMatchEditor, setShowMatchEditor] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [showMultipleMatchResolver, setShowMultipleMatchResolver] =
    useState(false);
  const [currentMultipleMatches, setCurrentMultipleMatches] = useState<{
    invoiceId: string;
    matches: DetailedReconciliationMatch[];
  } | null>(null);

  // États pour la recherche, filtres et tri
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string | null>("confidence");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // États pour l'export Excel
  const [showExportWarning, setShowExportWarning] = useState(false);
  const [showExportLoading, setShowExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState("");

  // Vérification de l'authentification
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.push("/connexion");
    }
  }, [isAuthenticated, isLoadingAuth, router]);

  // Chargement des données
  useEffect(() => {
    const fetchReconciliation = async () => {
      if (!reconciliationId) return;

      try {
        setLoading(true);
        const data = await getReconciliationDetails(reconciliationId);
        if (data) {
          setReconciliation(data);
        } else {
          setError("Réconciliation non trouvée");
        }
      } catch (err) {
        setError("Erreur lors du chargement de la réconciliation");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && reconciliationId) {
      fetchReconciliation();
    }
  }, [isAuthenticated, reconciliationId]);

  // Fonction pour recharger les données
  const reloadReconciliation = useCallback(async () => {
    if (!reconciliationId) return;

    try {
      const data = await getReconciliationDetails(reconciliationId);
      if (data) {
        setReconciliation(data);
      }
    } catch (err) {
      console.error("Erreur lors du rechargement:", err);
    }
  }, [reconciliationId]);

  // Calculer les correspondances groupées
  const groupedMatches = useMemo(() => {
    return (
      reconciliation?.matches.reduce(
        (acc, match) => {
          const invoiceId = match.invoiceId;
          if (!acc[invoiceId]) {
            acc[invoiceId] = [];
          }
          acc[invoiceId].push(match);
          return acc;
        },
        {} as Record<string, DetailedReconciliationMatch[]>
      ) || {}
    );
  }, [reconciliation?.matches]);

  // Identifier les factures avec correspondances multiples
  const invoicesWithMultipleMatches = useMemo(() => {
    return Object.entries(groupedMatches)
      .filter(([, matches]) => matches.length > 1)
      .map(([invoiceId, matches]) => ({ invoiceId, matches }));
  }, [groupedMatches]);

  // Calculer les transactions non appariées
  const unmatchedTransactions = useMemo(() => {
    return (
      reconciliation?.transactions.filter(
        (transaction) =>
          !reconciliation.matches.some(
            (match) => match.transactionId === transaction.id
          )
      ) || []
    );
  }, [reconciliation?.transactions, reconciliation?.matches]);

  // Calculer les factures non appariées
  const unmatchedInvoices = useMemo(() => {
    return (
      reconciliation?.invoices.filter((invoice) => {
        const match = reconciliation.matches.find(
          (match) => match.invoiceId === invoice.id
        );
        return !match || match.matchType === "NONE" || !match.transactionId;
      }) || []
    );
  }, [reconciliation?.invoices, reconciliation?.matches]);

  // Helper functions
  const getInvoiceFromMatch = useCallback(
    (match: DetailedReconciliationMatch) => {
      return reconciliation?.invoices.find((inv) => inv.id === match.invoiceId);
    },
    [reconciliation?.invoices]
  );

  const getTransactionFromMatch = useCallback(
    (match: DetailedReconciliationMatch) => {
      return match.transactionId
        ? reconciliation?.transactions.find(
            (trans) => trans.id === match.transactionId
          )
        : undefined;
    },
    [reconciliation?.transactions]
  );

  // Gestionnaires pour les modals
  const handleEditMatch = useCallback(
    (match: DetailedReconciliationMatch, isEditing = false) => {
      setSelectedMatch(match);
      setIsEditingMode(isEditing);
      setShowMatchEditor(true);
    },
    []
  );

  const handleViewMatch = useCallback((match: DetailedReconciliationMatch) => {
    setSelectedMatch(match);
    setIsEditingMode(false);
    setShowMatchEditor(true);
  }, []);

  const closeMatchEditor = useCallback(() => {
    setShowMatchEditor(false);
    setSelectedMatch(null);
    setIsEditingMode(false);
  }, []);

  const handleMatchUpdated = useCallback(
    (updatedMatch: DetailedReconciliationMatch) => {
      if (reconciliation) {
        const updatedMatches = reconciliation.matches.map((match) =>
          match.id === updatedMatch.id ? updatedMatch : match
        );
        setReconciliation({
          ...reconciliation,
          matches: updatedMatches,
        });
        if (selectedMatch && selectedMatch.id === updatedMatch.id) {
          setSelectedMatch(updatedMatch);
        }
      }
    },
    [reconciliation, selectedMatch]
  );

  const handleMatchDeleted = useCallback(
    (matchId: string) => {
      if (reconciliation) {
        const updatedMatches = reconciliation.matches.filter(
          (match) => match.id !== matchId
        );
        setReconciliation({
          ...reconciliation,
          matches: updatedMatches,
        });
      }
    },
    [reconciliation]
  );

  const handleTitleUpdate = useCallback(
    (newTitle: string) => {
      if (reconciliation) {
        setReconciliation({
          ...reconciliation,
          title: newTitle,
        });
      }
    },
    [reconciliation]
  );

  const handleCreateMatch = useCallback(
    (newMatch: DetailedReconciliationMatch) => {
      if (reconciliation) {
        setReconciliation({
          ...reconciliation,
          matches: [...reconciliation.matches, newMatch],
        });
      }
    },
    [reconciliation]
  );

  const handleValidateMatch = useCallback(
    async (match: DetailedReconciliationMatch) => {
      try {
        const updatedMatch = await validateMatch(reconciliationId, match.id, [
          "Correspondance validée par l'utilisateur",
        ]);

        if (updatedMatch) {
          handleMatchUpdated(updatedMatch);
        } else {
          setError("Erreur lors de la validation");
        }
      } catch (error) {
        setError("Erreur lors de la validation");
        console.error(error);
      }
    },
    [reconciliationId, handleMatchUpdated]
  );

  const handleRejectMatch = useCallback(
    async (match: DetailedReconciliationMatch) => {
      if (!confirm("Êtes-vous sûr de vouloir rejeter cette correspondance ?")) {
        return;
      }

      try {
        const updatedMatch = await rejectMatch(reconciliationId, match.id, [
          "Correspondance rejetée par l'utilisateur",
        ]);

        if (updatedMatch) {
          handleMatchUpdated(updatedMatch);
        } else {
          setError("Erreur lors du rejet");
        }
      } catch (error) {
        setError("Erreur lors du rejet");
        console.error(error);
      }
    },
    [reconciliationId, handleMatchUpdated]
  );

  // Gestionnaires pour les correspondances multiples
  const handleOpenMultipleMatchResolver = useCallback(
    (invoiceId: string, matches: DetailedReconciliationMatch[]) => {
      setCurrentMultipleMatches({ invoiceId, matches });
      setShowMultipleMatchResolver(true);
    },
    []
  );

  const handleCloseMultipleMatchResolver = useCallback(() => {
    setShowMultipleMatchResolver(false);
    setCurrentMultipleMatches(null);
  }, []);

  const handleResolveMultipleMatches = useCallback(
    async (
      invoiceId: string,
      selectedMatchId: string | null,
      rejectedMatchIds: string[],
      newTransactionId?: string
    ) => {
      try {
        if (selectedMatchId) {
          for (const matchId of rejectedMatchIds) {
            await deleteMatch(reconciliationId, matchId);
          }
          await updateMatch(reconciliationId, selectedMatchId, {
            isManualMatch: true,
            notes: ["Choix manuel - correspondance validée par l'utilisateur"],
          });
        } else if (newTransactionId) {
          for (const matchId of rejectedMatchIds) {
            await deleteMatch(reconciliationId, matchId);
          }
          const newMatchData = {
            invoiceId,
            transactionId: newTransactionId,
            notes: ["Match manuel créé par l'utilisateur"],
            isManualMatch: true,
          };
          const newMatch = await createMatch(reconciliationId, newMatchData);
          if (!newMatch) {
            throw new Error("Erreur lors de la création du nouveau match");
          }
        } else {
          for (const matchId of rejectedMatchIds) {
            await deleteMatch(reconciliationId, matchId);
          }
        }

        handleCloseMultipleMatchResolver();
        await reloadReconciliation();
      } catch (error) {
        console.error(
          "Erreur lors de la résolution des correspondances multiples:",
          error
        );
        setError("Erreur lors de la résolution des correspondances multiples");
      }
    },
    [reconciliationId, reloadReconciliation, handleCloseMultipleMatchResolver]
  );

  // Fonction de tri
  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        if (sortDirection === "asc") {
          setSortDirection("desc");
        } else {
          setSortField(null);
          setSortDirection("asc");
        }
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField, sortDirection]
  );

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilters, sortField, sortDirection]);

  // Logique d'export Excel
  const hasActiveFilters = Boolean(searchTerm || selectedFilters.length > 0);
  const hasActiveSort = Boolean(sortField);

  const handleExportExcel = useCallback(() => {
    if (hasActiveFilters) {
      setShowExportWarning(true);
    } else {
      performExport();
    }
  }, [hasActiveFilters]);

  const performExport = useCallback(async () => {
    if (!reconciliation) return;

    try {
      setShowExportWarning(false);
      setShowExportLoading(true);
      setExportProgress(0);
      setExportStep("Démarrage de l'export...");

      // Récupérer tous les éléments (sans pagination)
      const allGroupedMatches = reconciliation.matches.reduce(
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

      // Marquer les correspondances multiples
      Object.keys(allGroupedMatches).forEach((invoiceId) => {
        allGroupedMatches[invoiceId].isOriginallyMultiple =
          allGroupedMatches[invoiceId].allMatches.length > 1;
      });

      // Appliquer les filtres si nécessaire
      let filteredGroups = allGroupedMatches;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered: typeof allGroupedMatches = {};

        Object.entries(allGroupedMatches).forEach(([invoiceId, group]) => {
          const invoiceMatches =
            group.invoice?.ref?.toLowerCase().includes(term) ||
            group.invoice?.tiers?.toLowerCase().includes(term);

          const filteredMatches = group.allMatches.filter((match) => {
            const transaction = getTransactionFromMatch(match);
            return (
              invoiceMatches ||
              transaction?.libelles?.toLowerCase().includes(term) ||
              transaction?.detailsMouvement?.toLowerCase().includes(term) ||
              match.matchType.toLowerCase().includes(term)
            );
          });

          const matchesGenericMultipleTerms =
            "multiple".includes(term) ||
            "correspondances multiples".includes(term);

          if (
            filteredMatches.length > 0 ||
            (group.isOriginallyMultiple && matchesGenericMultipleTerms)
          ) {
            filtered[invoiceId] = {
              ...group,
              allMatches: group.isOriginallyMultiple
                ? group.allMatches
                : filteredMatches,
            };
          }
        });

        filteredGroups = filtered;
      }

      // Créer les éléments d'affichage pour l'export
      const allDisplayItems: any[] = [];

      Object.entries(filteredGroups).forEach(([invoiceId, group]) => {
        if (group.isOriginallyMultiple) {
          const shouldIncludeByFilter =
            selectedFilters.length === 0 ||
            selectedFilters.includes("MULTIPLE");

          if (shouldIncludeByFilter) {
            allDisplayItems.push({
              type: "multiple",
              invoiceId,
              invoice: group.invoice,
              matches: group.allMatches,
              sortValue: "MULTIPLE",
            });
          }
        } else {
          const match = group.allMatches[0];
          let shouldIncludeByFilter = false;

          if (selectedFilters.length === 0) {
            shouldIncludeByFilter = true;
          } else {
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
            allDisplayItems.push({
              type: "single",
              invoiceId,
              invoice: group.invoice,
              match: match,
              sortValue: match.isManualMatch ? "MANUAL" : match.matchType,
            });
          }
        }
      });

      // Appliquer le tri si nécessaire
      if (sortField) {
        allDisplayItems.sort((a, b) => {
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

      await exportToExcel(
        {
          allDisplayItems,
          reconciliationId,
          reconciliationName: `${reconciliation.invoicesFileName} - ${reconciliation.transactionsFileName}`,
          reconciliationTitle: reconciliation.title,
          reconciliationDate: reconciliation.createdAt,
          getTransactionFromMatch,
          searchTerm,
          selectedFilters,
          sortField,
          sortDirection,
        },
        {
          onProgress: (progress, step) => {
            setExportProgress(progress);
            setExportStep(step);
          },
        }
      );

      setShowExportLoading(false);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      setShowExportLoading(false);
      setError("Erreur lors de l'export Excel");
    }
  }, [
    reconciliation,
    reconciliationId,
    searchTerm,
    selectedFilters,
    sortField,
    sortDirection,
    getInvoiceFromMatch,
    getTransactionFromMatch,
  ]);

  return {
    // États
    reconciliation,
    loading,
    error,
    isAuthenticated,
    isLoadingAuth,

    // États des modals
    selectedMatch,
    showMatchEditor,
    showCreateMatchModal,
    setShowCreateMatchModal,
    isEditingMode,
    showMultipleMatchResolver,
    currentMultipleMatches,

    // États des filtres et pagination
    searchTerm,
    setSearchTerm,
    selectedFilters,
    setSelectedFilters,
    sortField,
    sortDirection,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,

    // Données calculées
    groupedMatches,
    invoicesWithMultipleMatches,
    unmatchedTransactions,
    unmatchedInvoices,

    // Fonctions utilitaires
    getInvoiceFromMatch,
    getTransactionFromMatch,

    // Gestionnaires
    handleEditMatch,
    handleViewMatch,
    closeMatchEditor,
    handleMatchUpdated,
    handleMatchDeleted,
    handleCreateMatch,
    handleTitleUpdate,
    handleValidateMatch,
    handleRejectMatch,
    handleOpenMultipleMatchResolver,
    handleCloseMultipleMatchResolver,
    handleResolveMultipleMatches,
    handleSort,
    reloadReconciliation,

    // Export Excel
    handleExportExcel,
    showExportWarning,
    setShowExportWarning,
    showExportLoading,
    exportProgress,
    exportStep,
    performExport,
    hasActiveFilters,
    hasActiveSort,
  };
}
