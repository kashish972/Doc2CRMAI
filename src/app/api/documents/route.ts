import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import { DocumentModel } from "@/server/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    
    if (status && status !== "all") {
      query.extractionStatus = status;
    }
    
    if (search) {
      query.originalName = { $regex: search, $options: "i" };
    }

    const documents = await DocumentModel.find(query)
      .select("originalName fileType extractionStatus llmModel parsedData createdAt updatedAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      documents: documents.map((doc) => ({
        id: doc._id,
        originalName: doc.originalName,
        fileType: doc.fileType,
        extractionStatus: doc.extractionStatus,
        llmModel: doc.llmModel,
        parsedData: doc.parsedData,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get documents" },
      { status: 500 }
    );
  }
}
