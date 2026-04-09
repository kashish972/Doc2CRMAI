import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPlatformTenant extends Document {
  name: string;
  slug: string;
  dbName: string;
  ownerUserId: Types.ObjectId | null;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlatformUser extends Document {
  tenantId: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "owner" | "admin" | "member";
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<IPlatformTenant>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    dbName: { type: String, required: true, unique: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "PlatformUser", default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

const UserSchema = new Schema<IPlatformUser>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "PlatformTenant", required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "owner" },
  },
  { timestamps: true }
);

export const PlatformTenantModel =
  mongoose.models.PlatformTenant || mongoose.model<IPlatformTenant>("PlatformTenant", TenantSchema);
export const PlatformUserModel =
  mongoose.models.PlatformUser || mongoose.model<IPlatformUser>("PlatformUser", UserSchema);
