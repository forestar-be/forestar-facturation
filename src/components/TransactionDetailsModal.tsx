"use client";

import { useState } from "react";
import { Euro, Eye, FileText } from "lucide-react";
import {
  Button,
  DataList,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@forestar-be/ui";
import { formatAmount } from "@/lib/format";
import { DetailedBankTransaction } from "@/types";

interface TransactionDetailsModalProps {
  transaction: DetailedBankTransaction;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionDetailsModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[min(92vw,42rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-5 text-primary" />
            Détails de la transaction
          </DialogTitle>
        </DialogHeader>

        <div className="min-w-0 space-y-5">
          {/* Informations principales */}
          <section className="rounded-lg bg-info/10 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-medium">
              <Euro className="size-4" />
              Informations principales
            </h3>
            <DataList
              items={[
                {
                  label: "Montant",
                  value: (
                    <span className="text-lg font-semibold">
                      {formatAmount(transaction.montant)}
                    </span>
                  ),
                },
                { label: "Date comptable", value: transaction.dateComptable },
              ]}
            />
          </section>

          {/* Libellés */}
          <section className="space-y-3 rounded-lg bg-muted/50 p-4">
            <h3 className="font-medium">Libellés</h3>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Libellé principal:
              </span>
              <p className="mt-1 rounded border bg-card p-3 text-sm">
                {transaction.libelles || "Aucun libellé"}
              </p>
            </div>
            {transaction.detailsMouvement && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Détails du mouvement:
                </span>
                <p className="mt-1 rounded border bg-card p-3 text-sm whitespace-pre-wrap">
                  {transaction.detailsMouvement}
                </p>
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Composant bouton discret pour déclencher la modal
interface TransactionDetailsButtonProps {
  transaction: DetailedBankTransaction;
  className?: string;
}

export function TransactionDetailsButton({
  transaction,
  className = "",
}: TransactionDetailsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={className}
        title="Voir les détails de la transaction"
        aria-label="Voir les détails de la transaction"
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
      >
        <Eye />
      </Button>

      <TransactionDetailsModal
        transaction={transaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
