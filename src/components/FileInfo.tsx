import React from "react";
import { FileText, CreditCard, Layers } from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@forestar-be/ui";
import { formatInvoiceFamilies } from "@/lib/reconciliationUtils";

interface FileInfoProps {
  invoicesFileName: string;
  transactionsFileName: string;
  /** Familles de factures retenues (R005) ; vide : toutes. */
  invoiceFamilies?: string[];
}

export default function FileInfo({
  invoicesFileName,
  transactionsFileName,
  invoiceFamilies,
}: FileInfoProps) {
  const hasFamilies = !!invoiceFamilies && invoiceFamilies.length > 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informations sur les fichiers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Layers className="size-5 text-warning" />
              <span className="font-medium">Familles de factures</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5 text-sm text-muted-foreground">
              {hasFamilies ? (
                invoiceFamilies.map((family) => (
                  <Badge key={family} variant="outline">
                    {family}
                  </Badge>
                ))
              ) : (
                <span>{formatInvoiceFamilies(invoiceFamilies)}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
