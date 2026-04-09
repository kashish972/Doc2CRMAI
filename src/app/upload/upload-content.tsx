"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  File,
  Table,
  Image,
  ArrowRight,
  Sparkles,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const fileTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  xlsx: Table,
  image: Image,
};

const fileTypeColors: Record<string, string> = {
  pdf: "text-red-500 bg-red-500/10 border-red-500/20",
  docx: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  xlsx: "text-green-500 bg-green-500/10 border-green-500/20",
  image: "text-purple-500 bg-purple-500/10 border-purple-500/20",
};

export function UploadContent() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createGoogleFormAfterUpload, setCreateGoogleFormAfterUpload] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    document?: { id: string };
    error?: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
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
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, XLSX, or image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadResult({
        success: true,
        document: data.document,
      });

      toast({
        title: "Upload successful",
        description: "Your document has been uploaded and processed",
      });

      setTimeout(() => {
        const query = createGoogleFormAfterUpload ? "?createForm=1" : "";
        router.push(`/review/${data.document.id}${query}`);
      }, 1500);
    } catch (error) {
      setUploadResult({
        success: false,
        error: (error as Error).message,
      });

      toast({
        title: "Upload failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const fileTypes = [
    { type: "PDF", ext: "pdf", icon: FileText, color: fileTypeColors.pdf },
    { type: "Word", ext: "docx", icon: FileText, color: fileTypeColors.docx },
    { type: "Excel", ext: "xlsx", icon: Table, color: fileTypeColors.xlsx },
    { type: "Image", ext: "image", icon: Image, color: fileTypeColors.image },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-secondary/30 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center animate-fade-in">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="mr-1.5 h-4 w-4" />
            AI-Powered Extraction
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            Upload Your Document
          </h1>
          <p className="text-lg text-muted-foreground">
            Drag and drop or browse to upload. Our AI will extract the data automatically.
          </p>
        </div>

        <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5 animate-slide-in">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
          <CardHeader className="relative pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              Document Upload
            </CardTitle>
            <CardDescription>
              Supported formats: PDF, DOCX, XLSX, PNG, JPG, JPEG, GIF, BMP, WebP
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer",
                dragActive
                  ? "border-primary bg-primary/5 scale-[1.02] shadow-lg shadow-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-secondary/50",
                uploading && "pointer-events-none opacity-50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              // onClick={() => !uploading && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleChange}
                accept=".pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.bmp,.webp"
                disabled={uploading}
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <div className="absolute inset-2 flex items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-foreground">
                      Processing your document...
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Extracting text and preparing AI analysis
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5">
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-purple-600 p-4 shadow-lg shadow-primary/25">
                    <Upload className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">
                      Drop your file here
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      or click to browse files
                    </p>
                  </div>
                </div>
              )}
            </div>

            {uploadResult && (
              <div
                className={cn(
                  "mt-4 flex items-center gap-3 rounded-xl p-4 animate-scale-in",
                  uploadResult.success
                    ? "bg-green-500/10 border border-green-500/20 text-green-700"
                    : "bg-red-500/10 border border-red-500/20 text-red-700"
                )}
              >
                {uploadResult.success ? (
                  <CheckCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                )}
                <span className="text-sm font-medium">
                  {uploadResult.success
                    ? "Document uploaded successfully! Redirecting to review..."
                    : uploadResult.error}
                </span>
              </div>
            )}

            <div className="mt-8">
              <div className="mb-4 rounded-lg border bg-muted/30 p-3">
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={createGoogleFormAfterUpload}
                    onChange={(e) => setCreateGoogleFormAfterUpload(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="font-medium text-foreground">
                    After upload, help me create a Google Form from extracted fields
                  </span>
                </label>
              </div>

              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Supported file types
              </p>
              <div className="grid grid-cols-4 gap-3">
                {fileTypes.map((file) => (
                  <div
                    key={file.type}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:scale-105",
                      file.color
                    )}
                  >
                    <file.icon className="h-6 w-6" />
                    <span className="text-xs font-semibold">{file.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Free to use</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Secure processing</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>AI-powered extraction</span>
          </div>
        </div>
      </div>
    </div>
  );
}
