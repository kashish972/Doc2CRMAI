"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { formatDate } from "@/lib/utils";
import { FileText, Table, Image, File, ExternalLink, Upload } from "@/components/icons";
import type { ColDef, ICellRendererParams } from "ag-grid-community";

interface Document {
  id: string;
  originalName: string;
  fileType: string;
  extractionStatus: string;
  llmModel: string;
  parsedData: {
    fullName?: string;
    company?: string;
    confidence?: number;
  } | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

const FileTypeCellRenderer = (props: ICellRendererParams<Document, unknown>) => {
  const type = props.value as string;
  const iconMap: Record<string, typeof FileText> = {
    pdf: FileText,
    docx: FileText,
    xlsx: Table,
    image: Image,
  };
  const colorMap: Record<string, string> = {
    pdf: "text-red-500 bg-red-500/10",
    docx: "text-blue-500 bg-blue-500/10",
    xlsx: "text-green-500 bg-green-500/10",
    image: "text-purple-500 bg-purple-500/10",
  };
  const Icon = iconMap[type] || File;
  const colorClass = colorMap[type] || "text-muted-foreground bg-secondary";

  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="font-medium">{props.data?.originalName}</span>
    </div>
  );
};

const StatusCellRenderer = (props: ICellRendererParams<Document, unknown>) => {
  const status = props.value as string;
  return (
    <Badge className={`${statusColors[status]} text-white`}>
      {statusLabels[status] || status}
    </Badge>
  );
};

const ExtractedDataCellRenderer = (props: ICellRendererParams<Document, unknown>) => {
  const parsedData = props.value as Document["parsedData"];
  if (!parsedData) return <span className="text-muted-foreground">-</span>;
  
  return (
    <div className="text-sm">
      <p>{parsedData.fullName || "No name"}</p>
      <p className="text-muted-foreground">{parsedData.company || "No company"}</p>
    </div>
  );
};

const ActionsCellRenderer = (props: ICellRendererParams<Document, unknown>) => {
  return (
    <Link href={`/review/${props.value}`}>
      <Button variant="ghost" size="sm">
        <ExternalLink className="h-4 w-4 mr-1" />
        Review
      </Button>
    </Link>
  );
};

export function DocumentsContent() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch("/api/documents");
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const columnDefs = useMemo<ColDef<Document>[]>(() => [
    {
      headerName: "File",
      field: "originalName",
      minWidth: 250,
      cellRenderer: FileTypeCellRenderer,
    },
    {
      headerName: "Type",
      field: "fileType",
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams<Document, unknown>) => (
        <Badge variant="outline">{params.value?.toString().toUpperCase()}</Badge>
      ),
    },
    {
      headerName: "Status",
      field: "extractionStatus",
      minWidth: 120,
      cellRenderer: StatusCellRenderer,
    },
    {
      headerName: "Extracted Data",
      field: "parsedData",
      minWidth: 180,
      cellRenderer: ExtractedDataCellRenderer,
    },
    {
      headerName: "Model",
      field: "llmModel",
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<Document, string>) => (
        <span className="text-muted-foreground">{params.value || "-"}</span>
      ),
    },
    {
      headerName: "Created",
      field: "createdAt",
      minWidth: 120,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      headerName: "Actions",
      field: "id",
      minWidth: 100,
      cellRenderer: ActionsCellRenderer,
      sortable: false,
      filter: false,
    },
  ], []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">View and manage uploaded documents</p>
        </div>
        <Link href="/upload">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </Link>
      </div>

      <DataTable
        title="All Documents"
        data={documents}
        columnDefs={columnDefs}
        loading={loading}
        searchPlaceholder="Search documents..."
        emptyMessage="No documents found. Upload a document to get started."
      />
    </div>
  );
}
