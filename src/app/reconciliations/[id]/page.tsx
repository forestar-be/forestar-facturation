"use client";

import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import MatchEditor from "@/components/MatchEditor";
import CreateMatchModal from "@/components/CreateMatchModal";
import MultipleMatchResolver from "@/components/MultipleMatchResolver";
import ReconciliationHeader from "@/components/ReconciliationHeader";
import ReconciliationAlerts from "@/components/ReconciliationAlerts";
import ReconciliationFilters from "@/components/ReconciliationFilters";
import MatchesTable from "@/components/MatchesTable";
import Pagination from "@/components/Pagination";
import FileInfo from "@/components/FileInfo";
import ExportWarningModal from "@/components/ExportWarningModal";
import ExportLoadingModal from "@/components/ExportLoadingModal";
import { useReconciliationDetail } from "@/hooks/useReconciliationDetail";
import { useReconciliationFilters } from "@/hooks/useReconciliationFilters";

export default function ReconciliationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reconciliationId = params.id as string;

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
    sortField,
    sortDirection,
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
    handleValidateMatch,
    handleRejectMatch,
    handleOpenMultipleMatchResolver,
    handleCloseMultipleMatchResolver,
    handleResolveMultipleMatches,
    handleSort,
    handleExportExcel,
    showExportWarning,
    setShowExportWarning,
    showExportLoading,
    exportProgress,
    exportStep,
    performExport,
    hasActiveFilters,
    hasActiveSort,
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
    sortField,
    sortDirection,
    currentPage,
    itemsPerPage,
    getInvoiceFromMatch,
    getTransactionFromMatch
  );

  const { totalItems, totalPages, startIndex, endIndex, paginatedItems } =
    paginationData;

  // Gestionnaires pour la pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Revenir à la première page
  };

  // Chargement ou non authentifié
  if (isLoadingAuth || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Erreur ou réconciliation non trouvée
  if (error || !reconciliation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">
              {error || "Réconciliation non trouvée"}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* En-tête avec navigation et statistiques */}
          <ReconciliationHeader
            reconciliation={reconciliation}
            onBack={() => router.push("/reconciliations")}
          />

          {/* Liste des correspondances avec filtres intégrés */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col space-y-4">
                {/* Filtres et recherche */}
                <ReconciliationFilters
                  searchTerm={searchTerm}
                  selectedFilters={selectedFilters}
                  availableFilterTypes={availableFilterTypes}
                  filterTypeCounts={filterTypeCounts}
                  totalItemsCount={totalItemsCount}
                  onSearchChange={setSearchTerm}
                  onFiltersChange={setSelectedFilters}
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
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                )}

                {/* Tableau des correspondances */}
                <MatchesTable
                  displayItems={paginatedItems}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  searchTerm={searchTerm}
                  getTransactionFromMatch={getTransactionFromMatch}
                  onSort={handleSort}
                  onViewMatch={handleViewMatch}
                  onEditMatch={(match) => handleEditMatch(match, true)}
                  onValidateMatch={handleValidateMatch}
                  onRejectMatch={handleRejectMatch}
                  onResolveMultiple={handleOpenMultipleMatchResolver}
                />

                {/* Pagination en bas */}
                {totalItems > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-700">
                      Page {currentPage} sur {totalPages}
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      startIndex={startIndex}
                      endIndex={endIndex}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      showItemsPerPageSelector={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informations sur les fichiers */}
          <FileInfo
            invoicesFileName={reconciliation.invoicesFileName}
            transactionsFileName={reconciliation.transactionsFileName}
          />
        </div>

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
      </main>

      {/* Modals d'export Excel */}
      <ExportWarningModal
        isOpen={showExportWarning}
        onClose={() => setShowExportWarning(false)}
        onConfirm={performExport}
        hasFilters={hasActiveFilters}
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