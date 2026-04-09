import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import { DocumentModel } from "@/server/models";
import { extractTextFromBuffer } from "@/server/utils";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/bmp",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not supported: ${file.type}` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, fileType } = await extractTextFromBuffer(buffer, file.name);

    const document = await DocumentModel.create({
      originalName: file.name,
      fileType,
      rawText: text,
      extractionStatus: "pending",
      llmModel: "",
      llmRawResponse: "",
      parsedData: null,
      validationErrors: [],
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document._id,
        originalName: document.originalName,
        fileType: document.fileType,
        extractionStatus: document.extractionStatus,
        rawText: document.rawText.substring(0, 500),
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Upload failed" },
      { status: 500 }
    );
  }
}
