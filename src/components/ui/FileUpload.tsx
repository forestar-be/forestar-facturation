"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";

interface FileUploadProps {
  label: string;
  accept: string;
  onFileSelect: (file: File) => void;
  loading?: boolean;
  error?: string;
  success?: boolean;
  fileName?: string;
}

export default function FileUpload({
  label,
  accept,
  onFileSelect,
  loading = false,
  error,
  success = false,
  fileName,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : success
                ? "border-green-500 bg-green-50"
                : error
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
          }
          ${loading ? "pointer-events-none opacity-75" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-center">
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-gray-600">Traitement en cours...</p>
            </div>
          ) : success && fileName ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-900">{fileName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="cursor-pointer text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Fichier chargé avec succès
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center">
              <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-xs text-gray-500 mt-1">
                Cliquez pour réessayer
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Déposez votre fichier ici ou{" "}
                <span className="text-blue-600 underline">
                  cliquez pour parcourir
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Formats acceptés: CSV (max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
