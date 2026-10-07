import React, { useState } from "react";
import { Info } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@forestar-be/ui";

interface InfoModalProps {
  title: string;
  content: React.ReactNode;
}

export default function InfoModal({ title, content }: InfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Bouton d'information */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="rounded-full text-info"
        title="Plus d'informations"
        aria-label="Plus d'informations"
        onClick={() => setIsOpen(true)}
      >
        <Info />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">{title}</DialogTitle>
          </DialogHeader>
          {content}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
