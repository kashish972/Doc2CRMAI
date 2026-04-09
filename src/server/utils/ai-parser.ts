import { extractedDataSchema, type ExtractedData } from "../schemas/extracted-data";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const SYSTEM_PROMPT = `You are a document parsing assistant. Your task is to extract structured information from documents and return ONLY valid JSON.

Return a JSON object with these fields:
- fullName: string (person's full name, or empty string if not found)
- email: string (email address, or empty string if not found)
- phone: string (phone number, or empty string if not found)
- company: string (company name, or empty string if not found)
- documentType: string (type of document like invoice, contract, lead form, etc. - infer if possible, or empty string if not found)
- amount: number | null (numeric amount/money value, or null if not found)
- currency: string (currency code like USD, EUR, etc., default to USD)
- date: string (date mentioned in document, ISO format if possible, or empty string if not found)
- notes: string (any additional relevant notes, or empty string if not found)
- tags: string[] (relevant tags like ["invoice", "urgent", "contract"], or empty array if not found)
- confidence: number (your confidence level between 0 and 1)

IMPORTANT:
- Return ONLY valid JSON - no markdown, no explanations
- Use empty strings "" for missing text fields
- Use null for missing numeric fields
- Use empty array [] for missing arrays
- Infer document type if possible
- Include a confidence score between 0 and 1`;

export async function parseDocumentWithAI(rawText: string): Promise<{
  data: ExtractedData;
  rawResponse: string;
  validationErrors: string[];
}> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": APP_URL,
        "X-Title": "Doc2CRM AI",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Extract structured information from the following document text:\n\n${rawText}`,
          },
        ],
        temperature: 0.3,
        // max_tokens: 2000,
      }),
    });
console.log("OpenRouter API response status:", response);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const rawResponse = result.choices?.[0]?.message?.content || "";
    console.log("Raw AI response:", rawResponse);

    const parsedData = parseJSONResponse(rawResponse);

    const validationResult = extractedDataSchema.safeParse(parsedData);
    
    const validationErrors: string[] = [];
    
    if (!validationResult.success) {
      validationResult.error.errors.forEach((err) => {
        validationErrors.push(`${err.path.join(".")}: ${err.message}`);
      });
    }

    const data = parsedData as ExtractedData;

    return {
      data,
      rawResponse,
      validationErrors,
    };
  } catch (error) {
    console.error("AI parsing error:", error);
    throw error;
  }
}

function parseJSONResponse(response: string): unknown {
  let jsonStr = response.trim();

  jsonStr = jsonStr.replace(/^```json\s*/g, "");
  jsonStr = jsonStr.replace(/^```\s*/g, "");
  jsonStr = jsonStr.replace(/```$/g, "");
  
  jsonStr = jsonStr.replace(/^[^{]*\{/g, "{");
  jsonStr = jsonStr.replace(/\}[^}]*$/g, "}");

  try {
    return JSON.parse(jsonStr);
  } catch (initialError) {
    const extractedObj = extractJSONObject(jsonStr);
    if (extractedObj) {
      return extractedObj;
    }
    throw new Error(`Failed to parse JSON response: ${(initialError as Error).message}`);
  }
}

function extractJSONObject(str: string): unknown {
  const startIdx = str.indexOf("{");
  const endIdx = str.lastIndexOf("}");
  
  if (startIdx === -1 || endIdx === -1) {
    return null;
  }

  const jsonStr = str.substring(startIdx, endIdx + 1);
  
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
