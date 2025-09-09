"use client";

import { X, AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "danger" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title = "Confirmer l'action",
  message = "Êtes-vous sûr de vouloir continuer ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "warning",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconColor: "text-red-600",
          confirmButtonColor: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          borderColor: "border-red-200",
          bgColor: "bg-red-50",
        };
      case "warning":
        return {
          iconColor: "text-orange-600",
          confirmButtonColor:
            "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
          borderColor: "border-orange-200",
          bgColor: "bg-orange-50",
        };
      case "info":
        return {
          iconColor: "text-blue-600",
          confirmButtonColor:
            "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          borderColor: "border-blue-200",
          bgColor: "bg-blue-50",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[60]"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onCancel}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div
            className={`${styles.bgColor} ${styles.borderColor} border rounded-lg p-4`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className={`h-5 w-5 ${styles.iconColor}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">{message}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onCancel}
            className="cursor-pointer px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`cursor-pointer px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${styles.confirmButtonColor} focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
