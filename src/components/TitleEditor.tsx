import React, { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

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
      <div className={`flex items-center space-x-2 w-full ${className}`}>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoFocus
          disabled={isSaving}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="cursor-pointer inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sauvegarder"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          ) : (
            <Check className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="cursor-pointer inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Annuler"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center w-full ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-2xl font-bold text-gray-900">{title}</span>
        <button
          onClick={handleEdit}
          className="cursor-pointer inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
          title="Modifier le titre"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
