import { NextRequest, NextResponse } from "next/server";
import { createRealGoogleFormFromDocument, decodeGoogleOAuthState } from "@/server/utils/google-forms-real";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code")?.trim();
  const state = searchParams.get("state")?.trim();
  const error = searchParams.get("error")?.trim();

  if (error) {
    return redirectBack(request, extractDocumentId(state), error);
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing Google OAuth code or state" },
      { status: 400 }
    );
  }

  let documentId = "";
  try {
    documentId = decodeGoogleOAuthState(state).documentId;
    const result = await createRealGoogleFormFromDocument(code, state);

    const redirectUrl = new URL(`/review/${documentId}`, request.nextUrl.origin);
    redirectUrl.searchParams.set("googleFormCreated", "1");
    redirectUrl.searchParams.set("googleFormEditUrl", result.editUrl);
    redirectUrl.searchParams.set("googleFormResponderUrl", result.responderUrl);
    return NextResponse.redirect(redirectUrl);
  } catch (caughtError) {
    return redirectBack(
      request,
      documentId,
      (caughtError as Error).message || "Failed to create Google Form"
    );
  }
}

function extractDocumentId(state: string | null | undefined): string {
  if (!state) {
    return "";
  }

  try {
    return decodeGoogleOAuthState(state).documentId;
  } catch {
    return "";
  }
}

function redirectBack(request: NextRequest, documentId: string, message: string) {
  const targetDocumentId = documentId || request.nextUrl.searchParams.get("documentId") || "";
  if (!targetDocumentId) {
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const redirectUrl = new URL(`/review/${targetDocumentId}`, request.nextUrl.origin);
  redirectUrl.searchParams.set("googleFormError", message);
  return NextResponse.redirect(redirectUrl);
}
