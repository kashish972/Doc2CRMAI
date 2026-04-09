import { Schema, Document } from "mongoose";
import { createTenantModelProxy } from "./tenant-runtime";

export interface ICompany extends Document {
  name: string;
  domain: string;
  industry: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    domain: { type: String, default: "" },
    industry: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const CompanyModel = createTenantModelProxy<ICompany>("Company", CompanySchema);
