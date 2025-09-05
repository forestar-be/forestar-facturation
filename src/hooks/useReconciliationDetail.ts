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
    handleValidateMatch,
    handleRejectMatch,
    handleOpenMultipleMatchResolver,
    handleCloseMultipleMatchResolver,
    handleResolveMultipleMatches,
    handleSort,
    reloadReconciliation,
  };
}
