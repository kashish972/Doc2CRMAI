import fs from "fs";
import path from "path";
import { Buffer } from "buffer";

export type FileType = "pdf" | "docx" | "xlsx" | "image" | "unknown";

export function detectFileType(filename: string): FileType {
  const ext = path.extname(filename).toLowerCase();
  
  switch (ext) {
    case ".pdf":
      return "pdf";
    case ".docx":
      return "docx";
    case ".xlsx":
    case ".xls":
      return "xlsx";
    case ".png":
    case ".jpg":
    case ".jpeg":
    case ".gif":
    case ".bmp":
    case ".webp":
      return "image";
    default:
      return "unknown";
  }
}

export async function extractTextFromFile(
  filePath: string,
  fileType: FileType
): Promise<string> {
  switch (fileType) {
    case "pdf":
      return extractFromPdf(filePath);
    case "docx":
      return extractFromDocx(filePath);
    case "xlsx":
      return extractFromXlsx(filePath);
    case "image":
      return extractFromImage(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function extractFromPdf(filePath: string): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || "";
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${(error as Error).message}`);
  }
}

async function extractFromDocx(filePath: string): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error(`Failed to extract text from DOCX: ${(error as Error).message}`);
  }
}

async function extractFromXlsx(filePath: string): Promise<string> {
  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.readFile(filePath);
    let text = "";
    
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      text += csv + "\n";
    }
    
    return text;
  } catch (error) {
    console.error("XLSX extraction error:", error);
    throw new Error(`Failed to extract text from XLSX: ${(error as Error).message}`);
  }
}

async function extractFromImage(filePath: string): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    return text || "";
  } catch (error) {
    console.error("OCR extraction error:", error);
    throw new Error(`Failed to extract text from image: ${(error as Error).message}`);
  }
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<{ text: string; fileType: FileType }> {
  const fileType = detectFileType(filename);
  
  if (fileType === "unknown") {
    throw new Error(`Unsupported file type: ${filename}`);
  }

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `${Date.now()}-${filename}`);
  
  try {
    fs.writeFileSync(tempFilePath, buffer);
    const text = await extractTextFromFile(tempFilePath, fileType);
    return { text, fileType };
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}
