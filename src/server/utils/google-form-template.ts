import { type ExtractedData } from "../schemas/extracted-data";

export interface GoogleFormTemplateQuestion {
  label: string;
  type: "short" | "paragraph" | "number" | "date";
  suggestedValue: string;
}

export interface GoogleFormTemplateResult {
  title: string;
  description: string;
  createFormUrl: string;
  questions: GoogleFormTemplateQuestion[];
}

export function buildGoogleFormTemplate(data: ExtractedData): GoogleFormTemplateResult {
  const titleParts = [data.documentType, data.company].filter(Boolean);
  const title =
    titleParts.length > 0
      ? `${titleParts.join(" - ")} Intake Form`
      : "Document Intake Form";

  const description =
    "Generated from extracted document fields. Create a new Google Form and add the questions below.";

  const questions: GoogleFormTemplateQuestion[] = [
    { label: "Full Name", type: "short", suggestedValue: data.fullName || "" },
    { label: "Email", type: "short", suggestedValue: data.email || "" },
    { label: "Phone", type: "short", suggestedValue: data.phone || "" },
    { label: "Company", type: "short", suggestedValue: data.company || "" },
    { label: "Document Type", type: "short", suggestedValue: data.documentType || "" },
    {
      label: "Amount",
      type: "number",
      suggestedValue: data.amount !== null && data.amount !== undefined ? String(data.amount) : "",
    },
    { label: "Currency", type: "short", suggestedValue: data.currency || "USD" },
    { label: "Date", type: "date", suggestedValue: data.date || "" },
    { label: "Notes", type: "paragraph", suggestedValue: data.notes || "" },
    {
      label: "Tags",
      type: "short",
      suggestedValue: Array.isArray(data.tags) ? data.tags.join(", ") : "",
    },
  ];

  return {
    title,
    description,
    createFormUrl: "https://docs.google.com/forms/u/0/create",
    questions: questions.filter((q) => q.label.trim().length > 0),
  };
}
