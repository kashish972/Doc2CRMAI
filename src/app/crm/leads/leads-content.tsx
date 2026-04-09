"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { formatDate } from "@/lib/utils";
import { Plus, ExternalLink, Mail, Phone, Building2 } from "@/components/icons";
import type { ColDef, ICellRendererParams } from "ag-grid-community";

interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string | null;
  source: string;
  status: string;
  documentName: string | null;
  notes: string;
  tags: string[];
  createdAt: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-purple-500",
  converted: "bg-green-500",
  lost: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
  lost: "Lost",
};

const StatusCellRenderer = (props: ICellRendererParams<Lead, unknown>) => {
  const status = props.value as string;
  return (
    <Badge className={`${statusColors[status]} text-white`}>
      {statusLabels[status] || status}
    </Badge>
  );
};

const TagsCellRenderer = (props: ICellRendererParams<Lead, unknown>) => {
  const tags = props.value as string[];
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex gap-1 flex-wrap">
      {tags.slice(0, 3).map((tag: string) => (
        <Badge key={tag} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
      {tags.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{tags.length - 3}
        </Badge>
      )}
    </div>
  );
};

const ActionsCellRenderer = (props: ICellRendererParams<Lead, string>) => {
  return (
    <Link href={`/review/${props.data?.id}`}>
      <Button variant="ghost" size="sm">
        <ExternalLink className="h-4 w-4 mr-1" />
        View
      </Button>
    </Link>
  );
};

export function LeadsContent() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      const response = await fetch("/api/leads");
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const columnDefs = useMemo<ColDef<Lead>[]>(() => [
    {
      headerName: "Name",
      field: "fullName",
      minWidth: 180,
      cellRenderer: (params: ICellRendererParams<Lead, string>) => {
        return (
          <div className="flex items-center gap-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white font-medium text-sm">
              {params.value?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{params.value}</p>
              {params.data?.tags && params.data.tags.length > 0 && (
                <div className="flex gap-1 mt-0.5">
                  {params.data.tags.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      headerName: "Email",
      field: "email",
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<Lead, string>) => {
        return params.value ? (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{params.value}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      headerName: "Phone",
      field: "phone",
      minWidth: 140,
      cellRenderer: (params: ICellRendererParams<Lead, string>) => {
        return params.value ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{params.value}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      headerName: "Company",
      field: "companyName",
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<Lead, string>) => {
        return params.value ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{params.value}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      headerName: "Status",
      field: "status",
      minWidth: 120,
      cellRenderer: StatusCellRenderer,
    },
    {
      headerName: "Source",
      field: "source",
      minWidth: 120,
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
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Manage your leads and potential customers</p>
        </div>
        <Link href="/upload">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </Link>
      </div>

      <DataTable
        title="All Leads"
        data={leads}
        columnDefs={columnDefs}
        loading={loading}
        searchPlaceholder="Search leads..."
        emptyMessage="No leads found. Upload a document to create leads."
      />
    </div>
  );
}
