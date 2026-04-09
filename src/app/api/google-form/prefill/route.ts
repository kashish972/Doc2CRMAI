import { NextRequest, NextResponse } from "next/server";
import { extractedDataSchema } from "@/server/schemas/extracted-data";
import { generateGoogleFormPrefill } from "@/server/utils/google-form";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const formUrl = typeof body.formUrl === "string" ? body.formUrl.trim() : "";
    if (!formUrl) {
      return NextResponse.json({ error: "Google Form URL is required" }, { status: 400 });
    }

    const validation = extractedDataSchema.safeParse(body.extractedData);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid extracted data payload",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await generateGoogleFormPrefill(formUrl, validation.data);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate prefilled Google Form" },
      { status: 500 }
    );
  }
}
