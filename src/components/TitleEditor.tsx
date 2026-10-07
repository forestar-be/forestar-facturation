import React, { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button, Input, Spinner } from "@forestar-be/ui";

interface TitleEditorProps {
  title: string;
  onSave: (newTitle: string) => Promise<boolean>;
  placeholder?: string;
  className?: string;
}

export default function TitleEditor({
  title,
  onSave,
  placeholder = "Entrez un titre...",
  className = "",
}: TitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setEditValue(title);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave(editValue.trim());
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du titre:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex w-full items-center gap-2 ${className}`}>
        <Input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Titre de la réconciliation"
          className="h-10 min-w-0 flex-1 text-xl font-semibold md:text-xl"
          autoFocus
          disabled={isSaving}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleSave}
          disabled={isSaving}
          className="text-success"
          title="Sauvegarder"
          aria-label="Sauvegarder"
        >
          {isSaving ? (
            <Spinner size="sm" className="text-current" />
          ) : (
            <Check />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCancel}
          disabled={isSaving}
          title="Annuler"
          aria-label="Annuler"
        >
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex w-full items-center ${className}`}>
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-2xl">{title}</h1>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleEdit}
          title="Modifier le titre"
          aria-label="Modifier le titre"
        >
          <Pencil />
        </Button>
      </div>
    </div>
  );
}
