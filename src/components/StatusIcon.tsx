import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface StatusIconProps {
  status: string;
  className?: string;
}

export default function StatusIcon({
  status,
  className = "size-5",
}: StatusIconProps) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className={`${className} text-success`} />;
    case "ERROR":
      return <XCircle className={`${className} text-destructive`} />;
    case "PROCESSING":
      return <Clock className={`${className} animate-spin text-info`} />;
    case "PENDING":
      return <AlertCircle className={`${className} text-warning`} />;
    default:
      return <AlertCircle className={`${className} text-muted-foreground`} />;
  }
}
