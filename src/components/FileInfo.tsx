import React from "react";
import { FileText, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@forestar-be/ui";

interface FileInfoProps {
  invoicesFileName: string;
  transactionsFileName: string;
}

export default function FileInfo({
  invoicesFileName,
  transactionsFileName,
}: FileInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informations sur les fichiers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-info" />
              <span className="font-medium">Fichier factures</span>
            </div>
            <p className="mt-1 text-sm break-words text-muted-foreground">
              {invoicesFileName}
            </p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-success" />
              <span className="font-medium">Fichier transactions</span>
            </div>
            <p className="mt-1 text-sm break-words text-muted-foreground">
              {transactionsFileName}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
