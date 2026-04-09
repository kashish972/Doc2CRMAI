import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getFileTypeIcon(fileType: string): string {
  switch (fileType) {
    case "pdf":
      return "file-text";
    case "docx":
      return "file-text";
    case "xlsx":
      return "table";
    case "image":
      return "image";
    default:
      return "file";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-500";
    case "processing":
      return "bg-blue-500";
    case "completed":
      return "bg-green-500";
    case "failed":
      return "bg-red-500";
    case "new":
      return "bg-blue-500";
    case "contacted":
      return "bg-yellow-500";
    case "qualified":
      return "bg-purple-500";
    case "converted":
      return "bg-green-500";
    case "lost":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
}
