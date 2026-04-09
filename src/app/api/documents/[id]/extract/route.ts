import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import { DocumentModel } from "@/server/models";

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
        { error: "No raw text to extract - please upload a file first" },
        { status: 400 }
      );
    }

    await DocumentModel.findByIdAndUpdate(id, {
      extractionStatus: "completed",
    });

    return NextResponse.json({
      success: true,
      message: "Text extraction completed",
      rawTextLength: document.rawText.length,
    });
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Extraction failed" },
      { status: 500 }
    );
  }
}
