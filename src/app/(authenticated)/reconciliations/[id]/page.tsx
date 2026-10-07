"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ConfirmDialog,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from "@forestar-be/ui";
import MatchEditor from "@/components/MatchEditor";
import CreateMatchModal from "@/components/CreateMatchModal";
import MultipleMatchResolver from "@/components/MultipleMatchResolver";
import ReconciliationHeader from "@/components/ReconciliationHeader";
import ReconciliationAlerts from "@/components/ReconciliationAlerts";
import ReconciliationFilters from "@/components/ReconciliationFilters";
import MatchesTable from "@/components/MatchesTable";
import FileInfo from "@/components/FileInfo";
import ExportWarningModal from "@/components/ExportWarningModal";
import ExportLoadingModal from "@/components/ExportLoadingModal";
import { useReconciliationDetail } from "@/hooks/useReconciliationDetail";
import { useReconciliationFilters } from "@/hooks/useReconciliationFilters";
import { DetailedReconciliationMatch } from "@/types";

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

export default function ReconciliationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reconciliationId = params.id as string;

  // Rejet en attente de confirmation
  const [matchToReject, setMatchToReject] =
    useState<DetailedReconciliationMatch | null>(null);

  // Utiliser le hook personnalisé pour la logique principale
  const {
    reconciliation,
    loading,
    error,
    isAuthenticated,
    isLoadingAuth,
    selectedMatch,
    showMatchEditor,
    showCreateMatchModal,
    setShowCreateMatchModal,
    isEditingMode,
    showMultipleMatchResolver,
    currentMultipleMatches,
    searchTerm,
    setSearchTerm,
    selectedFilters,
    setSelectedFilters,
    sortConfig,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    invoicesWithMultipleMatches,
    unmatchedTransactions,
    unmatchedInvoices,
    getInvoiceFromMatch,
    getTransactionFromMatch,
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
    handleSortChange,
    handleExportExcel,
    showExportWarning,
    setShowExportWarning,
    showExportLoading,
    exportProgress,
    exportStep,
    performExport,
  } = useReconciliationDetail(reconciliationId);

  // Utiliser le hook pour les filtres et pagination
  const {
    availableFilterTypes,
    totalItemsCount,
    filterTypeCounts,
    paginationData,
  } = useReconciliationFilters(
    reconciliation?.matches || [],
    searchTerm,
    selectedFilters,
    sortConfig,
    currentPage,
    itemsPerPage,
    getInvoiceFromMatch,
    getTransactionFromMatch
  );

  const { totalItems, totalPages, startIndex, endIndex, paginatedItems } =
    paginationData;

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Revenir à la première page
  };

  // Chargement ou non authentifié
  if (isLoadingAuth || loading || !isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  // Erreur ou réconciliation non trouvée
  if (error || !reconciliation) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
      >
        {error || "Réconciliation non trouvée"}
      </div>
    );
  }

  const paginationProps = {
    from: startIndex + 1,
    to: Math.min(endIndex, totalItems),
    total: totalItems,
    onPrevious:
      currentPage > 1 ? () => setCurrentPage(currentPage - 1) : undefined,
    onNext:
      currentPage < totalPages
        ? () => setCurrentPage(currentPage + 1)
        : undefined,
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec navigation et statistiques */}
      <ReconciliationHeader
        reconciliation={reconciliation}
        onBack={() => router.push("/reconciliations")}
        onTitleUpdate={handleTitleUpdate}
      />

      {/* Liste des correspondances avec filtres intégrés */}
      <div className="flex flex-col gap-4">
        {/* Filtres et recherche */}
        <ReconciliationFilters
          searchTerm={searchTerm}
          selectedFilters={selectedFilters}
          availableFilterTypes={availableFilterTypes}
          filterTypeCounts={filterTypeCounts}
          totalItemsCount={totalItemsCount}
          sortConfig={sortConfig}
          onSearchChange={setSearchTerm}
          onFiltersChange={setSelectedFilters}
          onSortChange={handleSortChange}
          onCreateMatch={() => setShowCreateMatchModal(true)}
          onExportExcel={handleExportExcel}
        />

        {/* Statistiques rapides */}
        <ReconciliationAlerts
          unmatchedInvoicesCount={unmatchedInvoices.length}
          unmatchedTransactionsCount={unmatchedTransactions.length}
          invoicesWithMultipleMatches={invoicesWithMultipleMatches}
        />

        {/* Contrôles de pagination */}
        {totalItems > 0 && (
          <Pagination {...paginationProps} className="border-t-0 py-0">
            <div className="flex items-center gap-2 text-sm">
              <span>Afficher :</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) =>
                  handleItemsPerPageChange(Number(value))
                }
              >
                <SelectTrigger
                  size="sm"
                  className="w-20"
                  aria-label="Résultats par page"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>par page</span>
            </div>
          </Pagination>
        )}

        {/* Tableau des correspondances */}
        <MatchesTable
          displayItems={paginatedItems}
          searchTerm={searchTerm}
          getTransactionFromMatch={getTransactionFromMatch}
          onViewMatch={handleViewMatch}
          onEditMatch={(match) => handleEditMatch(match, true)}
          onValidateMatch={handleValidateMatch}
          onRejectMatch={setMatchToReject}
          onResolveMultiple={handleOpenMultipleMatchResolver}
        />

        {/* Pagination en bas */}
        {totalItems > 0 && totalPages > 1 && (
          <Pagination {...paginationProps}>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </span>
          </Pagination>
        )}
      </div>

      {/* Informations sur les fichiers */}
      <FileInfo
        invoicesFileName={reconciliation.invoicesFileName}
        transactionsFileName={reconciliation.transactionsFileName}
        invoiceFamilies={reconciliation.invoiceFamilies}
      />

      {/* Modal d'édition des correspondances */}
      {showMatchEditor && selectedMatch && (
        <MatchEditor
          match={selectedMatch}
          reconciliationId={reconciliationId}
          unmatchedTransactions={unmatchedTransactions}
          allInvoices={reconciliation?.invoices || []}
          allTransactions={reconciliation?.transactions || []}
          onMatchUpdated={handleMatchUpdated}
          onMatchDeleted={handleMatchDeleted}
          onMatchValidated={handleMatchUpdated}
          onMatchRejected={handleMatchUpdated}
          onClose={closeMatchEditor}
          initialEditingMode={isEditingMode}
        />
      )}

      {/* Modal de création de correspondances */}
      {showCreateMatchModal && (
        <CreateMatchModal
          reconciliationId={reconciliationId}
          unmatchedInvoices={unmatchedInvoices}
          unmatchedTransactions={unmatchedTransactions}
          onMatchCreated={handleCreateMatch}
          onClose={() => setShowCreateMatchModal(false)}
        />
      )}

      {/* Modal de résolution des correspondances multiples */}
      {showMultipleMatchResolver && currentMultipleMatches && (
        <MultipleMatchResolver
          invoiceId={currentMultipleMatches.invoiceId}
          matches={currentMultipleMatches.matches}
          reconciliationId={reconciliationId}
          unmatchedTransactions={unmatchedTransactions}
          allInvoices={reconciliation?.invoices || []}
          allTransactions={reconciliation?.transactions || []}
          onResolve={(selectedMatchId, rejectedMatchIds, newTransactionId) =>
            handleResolveMultipleMatches(
              currentMultipleMatches.invoiceId,
              selectedMatchId,
              rejectedMatchIds,
              newTransactionId
            )
          }
          onCancel={handleCloseMultipleMatchResolver}
        />
      )}

      {/* Confirmation du rejet depuis le tableau */}
      <ConfirmDialog
        open={matchToReject !== null}
        type="delete"
        title="Rejeter la correspondance"
        message="Êtes-vous sûr de vouloir rejeter cette correspondance ?"
        confirmText="Rejeter"
        onClose={() => setMatchToReject(null)}
        onConfirm={() => {
          if (matchToReject) void handleRejectMatch(matchToReject);
          setMatchToReject(null);
        }}
      />

      {/* Modals d'export Excel */}
      <ExportWarningModal
        isOpen={showExportWarning}
        onClose={() => setShowExportWarning(false)}
        onConfirm={performExport}
        searchTerm={searchTerm}
        selectedFilters={selectedFilters}
      />

      <ExportLoadingModal
        isOpen={showExportLoading}
        progress={exportProgress}
        currentStep={exportStep}
      />
    </div>
  );
}
