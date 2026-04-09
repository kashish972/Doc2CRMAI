import { type ExtractedData } from "../schemas/extracted-data";

export interface GoogleFormPrefillResult {
  prefilledUrl: string;
  matchedFields: Array<{
    entryId: string;
    label: string;
    extractedKey: keyof ExtractedData;
    value: string;
  }>;
  unmatchedFields: Array<{
    entryId: string;
    label: string;
  }>;
}

interface GoogleFormField {
  entryId: string;
  label: string;
}

const FIELD_MATCHERS: Array<{ key: keyof ExtractedData; patterns: RegExp[] }> = [
  { key: "fullName", patterns: [/full\s*name/i, /your\s*name/i, /name/i] },
  { key: "email", patterns: [/e-?mail/i, /email\s*address/i] },
  { key: "phone", patterns: [/phone/i, /mobile/i, /contact\s*number/i, /telephone/i] },
  { key: "company", patterns: [/company/i, /organization/i, /business/i] },
  { key: "documentType", patterns: [/document\s*type/i, /type\s*of\s*document/i, /document/i] },
  { key: "amount", patterns: [/amount/i, /total/i, /price/i, /cost/i] },
  { key: "currency", patterns: [/currency/i] },
  { key: "date", patterns: [/date/i] },
  { key: "notes", patterns: [/notes?/i, /comments?/i, /details?/i, /description/i, /message/i] },
  { key: "tags", patterns: [/tags?/i, /keywords?/i] },
];

export function normalizeGoogleFormUrl(inputUrl: string): string {
  const url = new URL(inputUrl);

  if (!url.hostname.includes("docs.google.com") || !url.pathname.includes("/forms/")) {
    throw new Error("Please provide a valid Google Form URL.");
  }

  const viewFormPath = url.pathname.includes("/viewform")
    ? url.pathname
    : `${url.pathname.replace(/\/$/, "")}/viewform`;

  return `${url.origin}${viewFormPath}`;
}

export async function generateGoogleFormPrefill(
  formUrl: string,
  extractedData: ExtractedData
): Promise<GoogleFormPrefillResult> {
  const normalizedUrl = normalizeGoogleFormUrl(formUrl);
  const response = await fetch(normalizedUrl, {
    headers: {
      "User-Agent": "Doc2CRM-AI/1.0",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch Google Form. Check the link and sharing settings.");
  }

  const html = await response.text();
  const fields = extractGoogleFormFields(html);

  if (fields.length === 0) {
    throw new Error("No fillable fields found in this Google Form.");
  }

  return buildPrefilledUrl(normalizedUrl, fields, extractedData);
}

function extractGoogleFormFields(html: string): GoogleFormField[] {
  const fieldRegex = /<(input|textarea|select)\b([^>]*?)>/gi;
  const fields = new Map<string, GoogleFormField>();

  let match: RegExpExecArray | null;
  while ((match = fieldRegex.exec(html)) !== null) {
    const attrs = match[2];
    const entryMatch = attrs.match(/name=["'](entry\.\d+)["']/i);

    if (!entryMatch) {
      continue;
    }

    const entryId = entryMatch[1];
    const label =
      readAttribute(attrs, "aria-label") ||
      readAttribute(attrs, "placeholder") ||
      readAttribute(attrs, "data-initial-value") ||
      entryId;

    if (!fields.has(entryId)) {
      fields.set(entryId, {
        entryId,
        label: decodeHtml(label).trim(),
      });
    }
  }

  if (fields.size > 0) {
    return Array.from(fields.values());
  }

  const fallbackFields = extractFieldsFromGoogleFormMetadata(html);
  if (fallbackFields.length > 0) {
    return fallbackFields;
  }

  // Some forms are not public and return a shell page with no field metadata.
  if (
    /sign in|only users in|organization|permission|access denied|private form/i.test(
      html
    )
  ) {
    throw new Error(
      "Google Form appears restricted. Make sure anyone with the link can open it."
    );
  }

  return [];
}

function extractFieldsFromGoogleFormMetadata(html: string): GoogleFormField[] {
  const payloadMatch = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);/);
  if (!payloadMatch) {
    return [];
  }

  let payload: unknown;
  try {
    payload = JSON.parse(payloadMatch[1]);
  } catch {
    return [];
  }

  if (!Array.isArray(payload)) {
    return [];
  }

  const questions = getQuestionsFromPayload(payload);
  const fields = new Map<string, GoogleFormField>();

  for (const question of questions) {
    if (!Array.isArray(question)) {
      continue;
    }

    const label =
      typeof question[1] === "string" && question[1].trim().length > 0
        ? decodeHtml(question[1])
        : "";

    const entryIds = extractEntryIds(question[4]);
    for (const id of entryIds) {
      const entryId = `entry.${id}`;
      if (!fields.has(entryId)) {
        fields.set(entryId, {
          entryId,
          label: label || entryId,
        });
      }
    }
  }

  return Array.from(fields.values());
}

function getQuestionsFromPayload(payload: unknown[]): unknown[] {
  const section = payload[1];
  if (!Array.isArray(section)) {
    return [];
  }

  const questions = section[1];
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions;
}

function extractEntryIds(node: unknown): number[] {
  const ids = new Set<number>();

  const walk = (value: unknown) => {
    if (!Array.isArray(value)) {
      return;
    }

    // In Google Form metadata, response entry ids are usually stored as the
    // first element inside arrays under question[4].
    const first = value[0];
    if (typeof first === "number" && first > 0) {
      ids.add(first);
    }

    for (const child of value) {
      walk(child);
    }
  };

  walk(node);

  return Array.from(ids);
}

function buildPrefilledUrl(
  baseUrl: string,
  fields: GoogleFormField[],
  extractedData: ExtractedData
): GoogleFormPrefillResult {
  const url = new URL(baseUrl);
  const usedKeys = new Set<keyof ExtractedData>();
  const matchedFields: GoogleFormPrefillResult["matchedFields"] = [];
  const unmatchedFields: GoogleFormPrefillResult["unmatchedFields"] = [];

  for (const field of fields) {
    const matched = matchFieldToExtractedKey(field.label, usedKeys);

    if (!matched) {
      unmatchedFields.push({ entryId: field.entryId, label: field.label });
      continue;
    }

    const value = toStringValue(extractedData[matched]);

    if (!value) {
      unmatchedFields.push({ entryId: field.entryId, label: field.label });
      continue;
    }

    url.searchParams.set(field.entryId, value);
    matchedFields.push({
      entryId: field.entryId,
      label: field.label,
      extractedKey: matched,
      value,
    });
    usedKeys.add(matched);
  }

  if (matchedFields.length === 0) {
    throw new Error("Could not map Google Form fields to extracted document data.");
  }

  url.searchParams.set("usp", "pp_url");

  return {
    prefilledUrl: url.toString(),
    matchedFields,
    unmatchedFields,
  };
}

function matchFieldToExtractedKey(
  label: string,
  usedKeys: Set<keyof ExtractedData>
): keyof ExtractedData | null {
  for (const matcher of FIELD_MATCHERS) {
    if (usedKeys.has(matcher.key)) {
      continue;
    }

    if (matcher.patterns.some((pattern) => pattern.test(label))) {
      return matcher.key;
    }
  }

  return null;
}

function toStringValue(value: ExtractedData[keyof ExtractedData]): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value).trim();
}

function readAttribute(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return match ? match[1] : null;
}

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}
