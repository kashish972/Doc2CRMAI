import mongoose, { Schema, Document } from "mongoose";

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

export const CompanyModel =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);
