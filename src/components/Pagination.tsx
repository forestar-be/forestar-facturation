import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  showItemsPerPageSelector?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  startIndex,
  endIndex,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPageSelector = true,
}: PaginationProps) {
  // Fonction pour générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Ajuster startPage si on est près de la fin
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 border-t border-gray-200 pt-4">
      {/* Informations et sélecteur nombre d'éléments par page */}
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500">
          {totalItems > 0 ? (
            <>
              Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)}{" "}
              sur {totalItems} résultat{totalItems > 1 ? "s" : ""}
            </>
          ) : (
            "Aucun résultat"
          )}
        </div>

        {showItemsPerPageSelector && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Afficher :</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">par page</span>
          </div>
        )}
      </div>

      {/* Navigation pagination */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-1">
          {/* Bouton Précédent */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="cursor-pointer relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Numéros de page */}
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`cursor-pointer relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                pageNumber === currentPage
                  ? "bg-blue-600 text-white border border-blue-600"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {pageNumber}
            </button>
          ))}

          {/* Bouton Suivant */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="cursor-pointer relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
