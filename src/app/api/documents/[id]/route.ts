import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import { DocumentModel } from "@/server/models";

export async function GET(
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

    return NextResponse.json({
      document: {
        id: document._id,
        originalName: document.originalName,
        fileType: document.fileType,
        rawText: document.rawText,
        extractionStatus: document.extractionStatus,
        llmModel: document.llmModel,
        llmRawResponse: document.llmRawResponse,
        parsedData: document.parsedData,
        validationErrors: document.validationErrors,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get document" },
      { status: 500 }
    );
  }
}
