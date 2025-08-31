"use client";

import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

interface ReconciliationProgressProps {
  status: string;
  progress: number;
  message: string;
}

export default function ReconciliationProgress({
  status,
  progress,
  message,
}: ReconciliationProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-600";
      case "failed":
        return "bg-red-600";
      case "processing":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "completed":
        return "Terminé";
      case "failed":
        return "Erreur";
      case "processing":
        return "En cours";
      default:
        return "En attente";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        {getStatusIcon()}
        <h3 className="text-lg font-semibold text-gray-900 ml-2">
          Progression de la réconciliation
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
