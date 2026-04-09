import { NextRequest, NextResponse } from "next/server";
import { extractedDataSchema } from "@/server/schemas/extracted-data";
import { buildGoogleFormTemplate } from "@/server/utils/google-form-template";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    const template = buildGoogleFormTemplate(validation.data);

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to build Google Form template" },
      { status: 500 }
    );
  }
}
