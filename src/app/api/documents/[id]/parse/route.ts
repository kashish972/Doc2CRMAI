import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import { DocumentModel } from "@/server/models";
import { parseDocumentWithAI } from "@/server/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const document = await DocumentModel.findById(id);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!document.rawText) {
      return NextResponse.json(
        { error: "No raw text to parse - please upload a file first" },
        { status: 400 }
      );
    }

    await DocumentModel.findByIdAndUpdate(id, {
      extractionStatus: "processing",
    });

    const model = process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo";
    const { data, rawResponse, validationErrors } = await parseDocumentWithAI(
      document.rawText
    );

    await DocumentModel.findByIdAndUpdate(id, {
      extractionStatus: "completed",
      llmModel: model,
      llmRawResponse: rawResponse,
      parsedData: data,
      validationErrors,
    });

    return NextResponse.json({
      success: true,
      parsedData: data,
      validationErrors,
      message: validationErrors.length > 0
        ? "Parsed with validation warnings"
        : "Successfully parsed",
    });
  } catch (error) {
    console.error("Parse error:", error);
    
    try {
      const { id } = await params;
      await DocumentModel.findByIdAndUpdate(id, {
        extractionStatus: "failed",
      });
    } catch {
      // Ignore update error
    }

    return NextResponse.json(
      { error: (error as Error).message || "AI parsing failed" },
      { status: 500 }
    );
  }
}
