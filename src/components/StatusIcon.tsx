import React from "react";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface StatusIconProps {
  status: string;
  className?: string;
}

export default function StatusIcon({
  status,
  className = "h-5 w-5",
}: StatusIconProps) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className={`${className} text-green-600`} />;
    case "ERROR":
      return <XCircle className={`${className} text-red-600`} />;
    case "PROCESSING":
      return <Clock className={`${className} text-blue-600 animate-spin`} />;
    case "PENDING":
      return <AlertCircle className={`${className} text-yellow-600`} />;
    default:
      return <AlertCircle className={`${className} text-gray-600`} />;
  }
}
