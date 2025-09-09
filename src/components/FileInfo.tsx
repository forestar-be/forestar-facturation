import React from "react";
import { FileText, CreditCard } from "lucide-react";

interface FileInfoProps {
  invoicesFileName: string;
  transactionsFileName: string;
}

export default function FileInfo({
  invoicesFileName,
  transactionsFileName,
}: FileInfoProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Informations sur les fichiers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-medium">Fichier factures</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{invoicesFileName}</p>
          </div>
          <div>
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-green-500 mr-2" />
              <span className="font-medium">Fichier transactions</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{transactionsFileName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
