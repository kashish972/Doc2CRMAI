import { NextRequest, NextResponse } from "next/server";
import { connectToPlatformDatabase } from "@/server/db";
import { PlatformUserModel } from "@/server/models/platform";
import { verifyPassword } from "@/server/auth/password";
import { createSessionToken, setSessionCookie } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  try {
    await connectToPlatformDatabase();

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await PlatformUserModel.findOne({ email });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: String(user._id),
      tenantId: String(user.tenantId),
      email: user.email,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        tenantId: String(user.tenantId),
        role: user.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Login failed" },
      { status: 500 }
    );
  }
}
