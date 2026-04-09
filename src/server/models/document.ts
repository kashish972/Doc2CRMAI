import mongoose, { Schema, Document } from "mongoose";

export interface IDocument extends Document {
  originalName: string;
  fileType: string;
  rawText: string;
  extractionStatus: "pending" | "processing" | "completed" | "failed";
  llmModel: string;
  llmRawResponse: string;
  parsedData: {
    fullName?: string;
    email?: string;
    phone?: string;
    company?: string;
    documentType?: string;
    amount?: number | null;
    currency?: string;
    date?: string;
    notes?: string;
    tags?: string[];
    confidence?: number;
  } | null;
  validationErrors: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    rawText: { type: String, default: "" },
    extractionStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    llmModel: { type: String, default: "" },
    llmRawResponse: { type: String, default: "" },
    parsedData: {
      type: Schema.Types.Mixed,
      default: null,
    },
    validationErrors: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const DocumentModel =
  mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);
