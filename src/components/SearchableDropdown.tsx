"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown } from "lucide-react";
import { DetailedBankTransaction, DetailedInvoice } from "@/types";
import { useTransactionSearch } from "@/hooks/useDebounce";
import { VirtualizedTransactionList } from "./VirtualizedTransactionList";
import { TransactionDetailsButton } from "./TransactionDetailsModal";

interface SearchableTransactionDropdownProps {
  transactions: DetailedBankTransaction[];
  selectedTransactionId: string;
  onTransactionSelect: (transactionId: string) => void;
  formatAmount: (amount: number) => string;
  label: string;
  placeholder?: string;
  emptyOptionText?: string;
  maxVisibleItems?: number;
  className?: string;
}

interface SearchableInvoiceDropdownProps {
  invoices: DetailedInvoice[];
  selectedInvoiceId: string;
  onInvoiceSelect: (invoiceId: string) => void;
  formatAmount: (amount: number) => string;
  label: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

// Interface pour la position du dropdown
interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

// Fonction utilitaire pour calculer la position du dropdown
function calculateDropdownPosition(
  triggerElement: HTMLElement,
  dropdownHeight: number = 300
): DropdownPosition {
  const rect = triggerElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Espace disponible en bas et en haut
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  // Hauteur minimale requise pour le dropdown (input + quelques items)
  const minHeight = 120;

  // Déterminer si on affiche en haut ou en bas
  const showAbove =
    spaceBelow < minHeight &&
    spaceAbove > spaceBelow &&
    spaceAbove >= minHeight;

  // Calculer la hauteur maximale avec plus de marge de sécurité
  const maxHeight = Math.min(
    dropdownHeight,
    showAbove
      ? Math.max(minHeight, spaceAbove - 20)
      : Math.max(minHeight, spaceBelow - 20)
  );

  // Calculer la position
  const top = showAbove ? rect.top - maxHeight - 5 : rect.bottom + 5;

  // S'assurer que le dropdown ne dépasse pas horizontalement
  const left = Math.min(rect.left, viewportWidth - rect.width - 10);

  return {
    top: Math.max(10, top),
    left: Math.max(10, left),
    width: rect.width,
    maxHeight: Math.max(minHeight, maxHeight),
  };
}

// Composant pour les transactions
export function SearchableTransactionDropdown({
  transactions,
  selectedTransactionId,
  onTransactionSelect,
  formatAmount,
  label,
  placeholder = "Rechercher une transaction...",
  emptyOptionText = "Aucune transaction",
  maxVisibleItems = 50,
  className = "",
}: SearchableTransactionDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] =
    useState<DropdownPosition | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const { debouncedSearch } = useTransactionSearch(searchTerm);

  // Calculer la position du dropdown quand il s'ouvre
  useEffect(() => {
    if (showDropdown && triggerRef.current) {
      const position = calculateDropdownPosition(triggerRef.current);
      setDropdownPosition(position);
    }
  }, [showDropdown]);

  // Recalculer la position lors du redimensionnement
  useEffect(() => {
    if (!showDropdown) return;

    const handleResize = () => {
      if (triggerRef.current) {
        const position = calculateDropdownPosition(triggerRef.current);
        setDropdownPosition(position);
      }
    };

    const handleScroll = () => {
      if (triggerRef.current) {
        const position = calculateDropdownPosition(triggerRef.current);
        setDropdownPosition(position);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showDropdown]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDropdown &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest(".searchable-dropdown-portal")
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Filtrer les transactions selon la recherche
  const filteredTransactions = useMemo(() => {
    if (!debouncedSearch) return transactions;

    const searchTermLower = debouncedSearch.toLowerCase();
    return transactions.filter((transaction) => {
      const libelles = transaction.libelles?.toLowerCase();
      if (libelles?.includes(searchTermLower)) return true;

      const details = transaction.detailsMouvement?.toLowerCase();
      if (details?.includes(searchTermLower)) return true;

      if (
        searchTermLower.match(/^\d/) &&
        transaction.montant.toString().includes(searchTermLower)
      )
        return true;

      return transaction.dateComptable?.includes(searchTermLower) || false;
    });
  }, [transactions, debouncedSearch]);

  const selectedTransaction = useMemo(
    () => transactions.find((t) => t.id === selectedTransactionId),
    [transactions, selectedTransactionId]
  );

  const handleTransactionSelect = useCallback(
    (transactionId: string) => {
      onTransactionSelect(transactionId);
      setShowDropdown(false);
      setSearchTerm("");
    },
    [onTransactionSelect]
  );

  const handleDropdownToggle = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  // Contenu du dropdown
  const dropdownContent = showDropdown && dropdownPosition && (
    <div
      className="searchable-dropdown-portal fixed bg-white border border-gray-300 rounded-md shadow-lg z-[9999] overflow-hidden"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        maxHeight: dropdownPosition.maxHeight,
      }}
    >
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            autoFocus
          />
        </div>
      </div>
      <div
        className="overflow-y-auto"
        style={{
          maxHeight: Math.max(60, dropdownPosition.maxHeight - 70),
          minHeight: 60,
        }}
      >
        <div
          className="cursor-pointer px-3 py-2 hover:bg-gray-50 border-b"
          onClick={() => handleTransactionSelect("")}
        >
          <span className="text-gray-500 text-sm">{emptyOptionText}</span>
        </div>
        <VirtualizedTransactionList
          transactions={filteredTransactions}
          selectedTransactionId={selectedTransactionId}
          onTransactionSelect={handleTransactionSelect}
          formatAmount={formatAmount}
          maxVisibleItems={maxVisibleItems}
        />
        {filteredTransactions.length === 0 && debouncedSearch && (
          <div className="px-3 py-2 text-sm text-gray-500">
            Aucune transaction trouvée
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div
          ref={triggerRef}
          className="cursor-pointer block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
          onClick={handleDropdownToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {selectedTransaction ? (
                <div className="text-sm">
                  <div className="font-medium text-gray-900 flex items-start">
                    <span className="flex-1 pr-2 line-clamp-3">
                      {selectedTransaction.libelles || "Libellé N/A"}
                    </span>
                    <TransactionDetailsButton
                      transaction={selectedTransaction}
                      className="flex-shrink-0 mt-0.5"
                      size="sm"
                    />
                  </div>
                  <div className="text-gray-500">
                    {formatAmount(selectedTransaction.montant)} -{" "}
                    {selectedTransaction.dateComptable || "Date N/A"}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">{emptyOptionText}</span>
              )}
            </div>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Utiliser un portail pour afficher le dropdown au-dessus de tout */}
        {typeof window !== "undefined" &&
          createPortal(dropdownContent, document.body)}
      </div>
    </div>
  );
}

// Composant simplifié pour les factures (utilisable dans CreateMatchModal)
export function SearchableInvoiceDropdown({
  invoices,
  selectedInvoiceId,
  onInvoiceSelect,
  formatAmount,
  label,
  placeholder = "Rechercher une facture...",
  required = false,
  className = "",
}: SearchableInvoiceDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] =
    useState<DropdownPosition | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const { debouncedSearch } = useTransactionSearch(searchTerm);

  // Calculer la position du dropdown quand il s'ouvre
  useEffect(() => {
    if (showDropdown && triggerRef.current) {
      const position = calculateDropdownPosition(triggerRef.current);
      setDropdownPosition(position);
    }
  }, [showDropdown]);

  // Recalculer la position lors du redimensionnement
  useEffect(() => {
    if (!showDropdown) return;

    const handleResize = () => {
      if (triggerRef.current) {
        const position = calculateDropdownPosition(triggerRef.current);
        setDropdownPosition(position);
      }
    };

    const handleScroll = () => {
      if (triggerRef.current) {
        const position = calculateDropdownPosition(triggerRef.current);
        setDropdownPosition(position);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showDropdown]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDropdown &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest(".searchable-dropdown-portal")
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Filtrer les factures selon la recherche
  const filteredInvoices = useMemo(() => {
    if (!debouncedSearch) return invoices;

    const searchTermLower = debouncedSearch.toLowerCase();
    return invoices.filter((invoice) => {
      const ref = invoice.ref?.toLowerCase();
      if (ref?.includes(searchTermLower)) return true;

      const tiers = invoice.tiers?.toLowerCase();
      if (tiers?.includes(searchTermLower)) return true;

      if (
        searchTermLower.match(/^\d/) &&
        invoice.montantTTC.toString().includes(searchTermLower)
      )
        return true;

      return invoice.dateFacturation?.includes(searchTermLower) || false;
    });
  }, [invoices, debouncedSearch]);

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === selectedInvoiceId),
    [invoices, selectedInvoiceId]
  );

  const handleInvoiceSelect = useCallback(
    (invoiceId: string) => {
      onInvoiceSelect(invoiceId);
      setShowDropdown(false);
      setSearchTerm("");
    },
    [onInvoiceSelect]
  );

  const handleDropdownToggle = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  // Contenu du dropdown
  const dropdownContent = showDropdown && dropdownPosition && (
    <div
      className="searchable-dropdown-portal fixed bg-white border border-gray-300 rounded-md shadow-lg z-[9999] overflow-hidden"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        maxHeight: dropdownPosition.maxHeight,
      }}
    >
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            autoFocus
          />
        </div>
      </div>
      <div
        className="overflow-y-auto"
        style={{
          maxHeight: Math.max(60, dropdownPosition.maxHeight - 70),
          minHeight: 60,
        }}
      >
        {!required && (
          <div
            className="cursor-pointer px-3 py-2 hover:bg-gray-50 border-b"
            onClick={() => handleInvoiceSelect("")}
          >
            <span className="text-gray-500 text-sm">Aucune facture</span>
          </div>
        )}
        {filteredInvoices.slice(0, 100).map((invoice) => (
          <div
            key={invoice.id}
            className={`cursor-pointer px-3 py-2 hover:bg-gray-50 border-b ${
              selectedInvoiceId === invoice.id ? "bg-blue-50" : ""
            }`}
            onClick={() => handleInvoiceSelect(invoice.id)}
          >
            <div className="text-sm">
              <div className="font-medium text-gray-900">
                {invoice.ref || "Réf N/A"} - {invoice.tiers || "Tiers N/A"}
              </div>
              <div className="text-gray-500">
                {formatAmount(invoice.montantTTC)}
                {invoice.dateFacturation && ` - ${invoice.dateFacturation}`}
              </div>
            </div>
          </div>
        ))}
        {filteredInvoices.length === 0 && debouncedSearch && (
          <div className="px-3 py-2 text-sm text-gray-500">
            Aucune facture trouvée
          </div>
        )}
        {filteredInvoices.length > 100 && (
          <div className="px-3 py-2 text-xs text-gray-500 italic border-b">
            ... et {filteredInvoices.length - 100} autres factures
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && "*"} ({invoices.length} disponibles)
      </label>
      <div className="relative">
        <div
          ref={triggerRef}
          className="cursor-pointer block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
          onClick={handleDropdownToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {selectedInvoice ? (
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {selectedInvoice.ref || "Réf N/A"} -{" "}
                    {selectedInvoice.tiers || "Tiers N/A"}
                  </div>
                  <div className="text-gray-500">
                    {formatAmount(selectedInvoice.montantTTC)}
                    {selectedInvoice.dateFacturation &&
                      ` - ${selectedInvoice.dateFacturation}`}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">Choisir une facture...</span>
              )}
            </div>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Utiliser un portail pour afficher le dropdown au-dessus de tout */}
        {typeof window !== "undefined" &&
          createPortal(dropdownContent, document.body)}
      </div>
    </div>
  );
}
