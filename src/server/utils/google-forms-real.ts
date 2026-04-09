import { google } from "googleapis";
import { connectToDatabase } from "@/server/db";
import { DocumentModel } from "@/server/models";
import { type ExtractedData } from "../schemas/extracted-data";
import { buildGoogleFormTemplate } from "./google-form-template";

export interface RealGoogleFormResult {
  formId: string;
  editUrl: string;
  responderUrl: string;
  title: string;
}

export interface GoogleOAuthState {
  documentId: string;
}

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/forms.body",
  "https://www.googleapis.com/auth/drive.file",
];

function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = buildRedirectUri();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
    );
  }

  return { clientId, clientSecret, redirectUri };
}

function buildRedirectUri(): string {
  const explicit = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (explicit) {
    return explicit;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL(appUrl);
  url.pathname = "/api/google-form/oauth/callback";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function buildGoogleOAuthStartUrl(documentId: string): string {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const state = Buffer.from(JSON.stringify({ documentId } satisfies GoogleOAuthState)).toString(
    "base64url"
  );

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export function decodeGoogleOAuthState(state: string): GoogleOAuthState {
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as GoogleOAuthState;
    if (!decoded.documentId) {
      throw new Error("Missing documentId in Google OAuth state");
    }
    return decoded;
  } catch {
    throw new Error("Invalid Google OAuth state");
  }
}

export async function createRealGoogleFormFromDocument(
  code: string,
  state: string
): Promise<RealGoogleFormResult> {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const { documentId } = decodeGoogleOAuthState(state);

  await connectToDatabase();
  const document = await DocumentModel.findById(documentId);

  if (!document) {
    throw new Error("Document not found");
  }

  if (!document.parsedData) {
    throw new Error("No parsed data available to build a Google Form");
  }

  const template = buildGoogleFormTemplate(document.parsedData as ExtractedData);
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const tokenResponse = await oauth2Client.getToken(code);

  if (!tokenResponse.tokens) {
    throw new Error("Google authorization failed");
  }

  oauth2Client.setCredentials(tokenResponse.tokens);

  const formsApi = google.forms({ version: "v1", auth: oauth2Client });
  const createResponse = await formsApi.forms.create({
    unpublished: false,
    requestBody: {
      info: {
        title: template.title,
        documentTitle: template.title,
      },
    },
  });

  const formId = createResponse.data.formId;
  if (!formId) {
    throw new Error("Google Forms API did not return a form ID");
  }

  const createRequests = template.questions.map((question, index) => ({
    createItem: {
      location: { index },
      item: buildQuestionItem(question.label, question.type),
    },
  }));

  await formsApi.forms.batchUpdate({
    formId,
    requestBody: {
      includeFormInResponse: true,
      requests: [
        {
          updateFormInfo: {
            info: { description: template.description },
            updateMask: "description",
          },
        },
        ...createRequests,
      ],
    },
  });

  return {
    formId,
    editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
    responderUrl: `https://docs.google.com/forms/d/${formId}/viewform`,
    title: template.title,
  };
}

function buildQuestionItem(
  label: string,
  type: "short" | "paragraph" | "number" | "date"
) {
  if (type === "date") {
    return {
      title: label,
      questionItem: {
        question: {
          required: false,
          dateQuestion: {
            includeYear: true,
            includeTime: false,
          },
        },
      },
    };
  }

  return {
    title: label,
    questionItem: {
      question: {
        required: false,
        textQuestion: {
          paragraph: type === "paragraph",
        },
      },
    },
  };
}
