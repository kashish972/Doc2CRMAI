import type { Connection, Model } from "mongoose";
import mongoose, { Schema, Types } from "mongoose";

export interface TenantDocument {
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

export interface TenantLead extends mongoose.Document {
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

export interface TenantCompany extends mongoose.Document {
  name: string;
  domain: string;
  industry: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantContact extends mongoose.Document {
  fullName: string;
  email: string;
  phone: string;
  companyId: Types.ObjectId | null;
  leadId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantActivity extends mongoose.Document {
  type: string;
  title: string;
  description: string;
  leadId: Types.ObjectId | null;
  contactId: Types.ObjectId | null;
  companyId: Types.ObjectId | null;
  documentId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new mongoose.Schema<TenantDocument>(
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
    parsedData: { type: Schema.Types.Mixed, default: null },
    validationErrors: [{ type: String }],
  },
  { timestamps: true }
);

const LeadSchema = new mongoose.Schema<TenantLead>(
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
  { timestamps: true }
);

const CompanySchema = new mongoose.Schema<TenantCompany>(
  {
    name: { type: String, required: true },
    domain: { type: String, default: "" },
    industry: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const ContactSchema = new mongoose.Schema<TenantContact>(
  {
    fullName: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null },
  },
  { timestamps: true }
);

const ActivitySchema = new mongoose.Schema<TenantActivity>(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", default: null },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
  },
  { timestamps: true }
);

export interface TenantModels {
  DocumentModel: Model<TenantDocument>;
  LeadModel: Model<TenantLead>;
  CompanyModel: Model<TenantCompany>;
  ContactModel: Model<TenantContact>;
  ActivityModel: Model<TenantActivity>;
}

export function getTenantModels(connection: Connection): TenantModels {
  return {
    DocumentModel:
      connection.models.Document || connection.model<TenantDocument>("Document", DocumentSchema),
    LeadModel: connection.models.Lead || connection.model<TenantLead>("Lead", LeadSchema),
    CompanyModel:
      connection.models.Company || connection.model<TenantCompany>("Company", CompanySchema),
    ContactModel:
      connection.models.Contact || connection.model<TenantContact>("Contact", ContactSchema),
    ActivityModel:
      connection.models.Activity || connection.model<TenantActivity>("Activity", ActivitySchema),
  };
}
