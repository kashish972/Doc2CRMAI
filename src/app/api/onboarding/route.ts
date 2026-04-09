import { NextRequest, NextResponse } from "next/server";
import { connectToPlatformDatabase, buildTenantDbName } from "@/server/db";
import { PlatformTenantModel, PlatformUserModel } from "@/server/models/platform";
import { hashPassword } from "@/server/auth/password";
import { createSessionToken, setSessionCookie } from "@/server/auth/session";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "tenant";
}

export async function POST(request: NextRequest) {
  try {
    await connectToPlatformDatabase();

    const body = await request.json();
    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
    const adminName = typeof body.adminName === "string" ? body.adminName.trim() : "";
    const adminEmail = typeof body.adminEmail === "string" ? body.adminEmail.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const slugInput = typeof body.slug === "string" ? body.slug.trim() : "";

    if (!companyName || !adminName || !adminEmail || !password) {
      return NextResponse.json(
        { error: "Company name, admin name, admin email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await PlatformUserModel.findOne({ email: adminEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const slug = slugify(slugInput || companyName);
    const existingTenant = await PlatformTenantModel.findOne({ slug });
    if (existingTenant) {
      return NextResponse.json(
        { error: "This tenant slug is already in use" },
        { status: 409 }
      );
    }

    const tenantDbName = buildTenantDbName(slug);
    const passwordHash = hashPassword(password);

    const tenant = await PlatformTenantModel.create({
      name: companyName,
      slug,
      dbName: tenantDbName,
      status: "active",
      ownerUserId: null,
    });

    const user = await PlatformUserModel.create({
      tenantId: tenant._id,
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "owner",
    });

    tenant.ownerUserId = user._id;
    await tenant.save();

    const token = await createSessionToken({
      userId: String(user._id),
      tenantId: String(tenant._id),
      email: user.email,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      tenant: {
        id: String(tenant._id),
        name: tenant.name,
        slug: tenant.slug,
      },
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Onboarding failed" },
      { status: 500 }
    );
  }
}
