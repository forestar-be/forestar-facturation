import React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface MatchesTableHeaderProps {
  sortField: string | null;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

export default function MatchesTableHeader({
  sortField,
  sortDirection,
  onSort,
}: MatchesTableHeaderProps) {
  const renderSortIcon = (field: string) => {
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      );
    }
    return <ChevronsUpDown className="h-3 w-3 text-gray-400" />;
  };

  return (
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Facture
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Transaction
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
          onClick={() => onSort("type")}
        >
          <div className="flex items-center space-x-1">
            <span>Type</span>
            {renderSortIcon("type")}
          </div>
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
          onClick={() => onSort("confidence")}
        >
          <div className="flex items-center space-x-1">
            <span>Confiance</span>
            {renderSortIcon("confidence")}
          </div>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );
}
