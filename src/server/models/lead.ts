import { Schema, Document, Types } from "mongoose";
import { createTenantModelProxy } from "./tenant-runtime";

export interface ILead extends Document {
  fullName: string;
  email: string;
  phone: string;
  companyId: Types.ObjectId | null;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  documentId: Types.ObjectId | null;
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    fullName: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    source: { type: String, default: "document" },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "converted", "lost"],
      default: "new",
    },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    notes: { type: String, default: "" },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const LeadModel = createTenantModelProxy<ILead>("Lead", LeadSchema);
