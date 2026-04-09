import { NextRequest, NextResponse } from "next/server";
import { connectToPlatformDatabase } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { getSession } from "@/server/auth/session";
import { PlatformTenantModel, PlatformUserModel } from "@/server/models/platform";

const MANAGE_ROLES = new Set(["owner", "admin"]);
const CREATABLE_ROLES = new Set(["admin", "member"]);

function canManageUsers(role: string) {
  return MANAGE_ROLES.has(role);
}

function normalizeRole(value: unknown): "admin" | "member" {
  return value === "admin" ? "admin" : "member";
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageUsers(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToPlatformDatabase();

    const tenantExists = await PlatformTenantModel.exists({ _id: session.tenantId });

    if (!tenantExists) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const users = await PlatformUserModel.find({ tenantId: session.tenantId })
      .select("name email role createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      users: users.map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to load users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageUsers(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToPlatformDatabase();

    const tenantExists = await PlatformTenantModel.exists({ _id: session.tenantId });

    if (!tenantExists) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = normalizeRole(body.role);

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (!CREATABLE_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existingUser = await PlatformUserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    const user = await PlatformUserModel.create({
      tenantId: session.tenantId,
      name,
      email,
      passwordHash,
      role,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create user" },
      { status: 500 }
    );
  }
}