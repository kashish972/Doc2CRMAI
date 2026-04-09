declare module "pdf-parse" {
  const pdfParse: (
    buffer: Buffer,
    options?: {
      max?: number;
      min?: number;
      normalizeWhitespace?: boolean;
      disableCombineTextItems?: boolean;
    }
  ) => Promise<{
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    text: string;
    version: string;
  }>;
  export default pdfParse;
}

declare module "mammoth" {
  const mammoth: {
    extractRawText: (options: { path: string } | { buffer: Buffer }) => Promise<{
      value: string;
    }>;
    convertToHtml: (options: { path: string } | { buffer: Buffer }) => Promise<{
      value: string;
    }>;
  };
  export default mammoth;
  export function extractRawText(
    options: { path: string } | { buffer: Buffer }
  ): Promise<{ value: string }>;
  export function convertToHtml(
    options: { path: string } | { buffer: Buffer }
  ): Promise<{ value: string }>;
}

declare module "xlsx" {
  function read(data: Buffer, options?: Record<string, unknown>): {
    SheetNames: string[];
    Sheets: Record<string, Record<string, unknown>>;
  };
  function readFile(filename: string, options?: Record<string, unknown>): {
    SheetNames: string[];
    Sheets: Record<string, Record<string, unknown>>;
  };
  function write(workbook: unknown, options?: Record<string, unknown>): Buffer;
  const utils: {
    sheet_to_csv(sheet: Record<string, unknown>): string;
    json_to_sheet(data: Record<string, unknown>[]): Record<string, unknown>;
  };
  export { read, readFile, write, utils };
}
