import { NextRequest, NextResponse } from "next/server";
import { connectToPlatformDatabase } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { getSession } from "@/server/auth/session";
import { PlatformUserModel } from "@/server/models/platform";

type PlatformRole = "owner" | "admin" | "member";

function canManageUsers(role: string) {
  return role === "owner" || role === "admin";
}

function canManageTarget(actorRole: PlatformRole, targetRole: PlatformRole) {
  if (targetRole === "owner") {
    return false;
  }

  if (actorRole === "owner") {
    return true;
  }

  return targetRole === "member";
}

function normalizeRole(value: unknown): "admin" | "member" {
  return value === "admin" ? "admin" : "member";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageUsers(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToPlatformDatabase();

    const { userId } = await params;
    const targetUser = await PlatformUserModel.findById(userId);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (String(targetUser.tenantId) !== session.tenantId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (String(targetUser._id) === session.userId) {
      return NextResponse.json(
        { error: "You cannot edit your own membership from this screen" },
        { status: 400 }
      );
    }

    const actorRole = session.role as PlatformRole;
    const targetRole = targetUser.role as PlatformRole;

    if (!canManageTarget(actorRole, targetRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const requestedRole = normalizeRole(body.role);

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (actorRole === "admin" && requestedRole === "admin") {
      return NextResponse.json(
        { error: "Admins can only manage member users" },
        { status: 403 }
      );
    }

    targetUser.name = name;
    targetUser.role = requestedRole;

    if (password) {
      targetUser.passwordHash = hashPassword(password);
    }

    await targetUser.save();

    return NextResponse.json({
      success: true,
      user: {
        id: String(targetUser._id),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageUsers(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToPlatformDatabase();

    const { userId } = await params;
    const targetUser = await PlatformUserModel.findById(userId);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (String(targetUser.tenantId) !== session.tenantId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (String(targetUser._id) === session.userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account from this screen" },
        { status: 400 }
      );
    }

    const actorRole = session.role as PlatformRole;
    const targetRole = targetUser.role as PlatformRole;

    if (!canManageTarget(actorRole, targetRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await targetUser.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete user" },
      { status: 500 }
    );
  }
}