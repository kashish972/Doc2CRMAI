import { NextRequest, NextResponse } from "next/server";
import { buildGoogleOAuthStartUrl } from "@/server/utils/google-forms-real";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const documentId = searchParams.get("documentId")?.trim();

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  try {
    const authUrl = buildGoogleOAuthStartUrl(documentId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    const redirectUrl = new URL(`/review/${documentId}`, request.nextUrl.origin);
    redirectUrl.searchParams.set(
      "googleFormError",
      (error as Error).message || "Failed to start Google OAuth"
    );
    return NextResponse.redirect(redirectUrl);
  }
}
