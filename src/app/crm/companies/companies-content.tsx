"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { formatDate } from "@/lib/utils";
import { Building2, Globe, ExternalLink } from "@/components/icons";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  notes: string;
  createdAt: string;
}

const ActionsCellRenderer = (props: ICellRendererParams<Company, string>) => {
  return (
    <Link href={`/crm/companies/${props.value}`}>
      <Button variant="ghost" size="sm">
        <ExternalLink className="h-4 w-4 mr-1" />
        View
      </Button>
    </Link>
  );
};

export function CompaniesContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch("/api/companies");
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const columnDefs = useMemo<ColDef<Company>[]>(() => [
    {
      headerName: "Company",
      field: "name",
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<Company, string>) => {
        return (
          <div className="flex items-center gap-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-medium">{params.value}</span>
          </div>
        );
      },
    },
    {
      headerName: "Domain",
      field: "domain",
      minWidth: 180,
      cellRenderer: (params: ICellRendererParams<Company, string>) => {
        return params.value ? (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <a href={`https://${params.value}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {params.value}
            </a>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      headerName: "Industry",
      field: "industry",
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<Company, string>) => {
        return params.value ? (
          <Badge variant="secondary">{params.value}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      headerName: "Notes",
      field: "notes",
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<Company, string>) => {
        return params.value ? (
          <span className="line-clamp-2" title={params.value}>
            {params.value}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
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
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage company records</p>
        </div>
      </div>

      <DataTable
        title="All Companies"
        data={companies}
        columnDefs={columnDefs}
        loading={loading}
        searchPlaceholder="Search companies..."
        emptyMessage="No companies found. Companies are created when you save extracted data from documents."
      />
    </div>
  );
}
