import mongoose, { Schema, Document, Types } from "mongoose";

export interface IContact extends Document {
  fullName: string;
  email: string;
  phone: string;
  companyId: Types.ObjectId | null;
  leadId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    fullName: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null },
  },
  {
    timestamps: true,
  }
);

export const ContactModel =
  mongoose.models.Contact || mongoose.model<IContact>("Contact", ContactSchema);
