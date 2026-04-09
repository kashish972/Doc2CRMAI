import mongoose, { Schema, Document, Types } from "mongoose";

export interface IActivity extends Document {
  entityType: "lead" | "company" | "contact" | "document";
  entityId: Types.ObjectId;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    entityType: {
      type: String,
      enum: ["lead", "company", "contact", "document"],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

export const ActivityModel =
  mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);
