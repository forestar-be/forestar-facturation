"use client";

import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, Progress, Spinner } from "@forestar-be/ui";

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
        return <CheckCircle className="size-5 text-success" />;
      case "failed":
        return <AlertCircle className="size-5 text-destructive" />;
      case "processing":
        return <Spinner size="sm" className="size-5 text-info" />;
      default:
        return <Clock className="size-5 text-muted-foreground" />;
    }
  };

  const getStatusTone = () => {
    switch (status) {
      case "completed":
        return "success" as const;
      case "failed":
        return "danger" as const;
      case "processing":
        return "info" as const;
      default:
        return "neutral" as const;
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
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold">
            Progression du rapprochement
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{getStatusText()}</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>

          <Progress
            value={progress}
            tone={getStatusTone()}
            aria-label="Progression du rapprochement"
          />

          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
