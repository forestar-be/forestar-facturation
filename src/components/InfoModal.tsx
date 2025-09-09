import React, { useState } from "react";
import { Info, X } from "lucide-react";

interface InfoModalProps {
  title: string;
  content: React.ReactNode;
  iconClassName?: string;
  buttonClassName?: string;
}

export default function InfoModal({
  title,
  content,
  iconClassName = "h-4 w-4 text-blue-500 hover:text-blue-600",
  buttonClassName = "cursor-pointer inline-flex items-center justify-center rounded-full p-1 hover:bg-gray-100 transition-colors duration-200",
}: InfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {/* Bouton d'information */}
      <button
        onClick={openModal}
        className={buttonClassName}
        title="Plus d'informations"
      >
        <Info className={iconClassName} />
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          onClick={closeModal}
        >
          {/* Modal Content */}
          <div className="p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <button
                  onClick={closeModal}
                  className="cursor-pointer inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">{content}</div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
