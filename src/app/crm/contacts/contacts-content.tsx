"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { formatDate } from "@/lib/utils";
import { Contact, Mail, Phone, Building2, ExternalLink } from "@/components/icons";
import type { ColDef, ICellRendererParams } from "ag-grid-community";

interface ContactData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string | null;
  leadName: string | null;
  createdAt: string;
}

const ActionsCellRenderer = (props: ICellRendererParams<ContactData, unknown>) => {
  return (
    <Button variant="ghost" size="sm">
      <ExternalLink className="h-4 w-4 mr-1" />
      View
    </Button>
  );
};

export function ContactsContent() {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    try {
      const response = await fetch("/api/contacts");
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const columnDefs = useMemo<ColDef<ContactData>[]>(() => [
    {
      headerName: "Name",
      field: "fullName",
      minWidth: 180,
      cellRenderer: (params: ICellRendererParams<ContactData, string>) => {
        return (
          <div className="flex items-center gap-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white font-medium text-sm">
              {params.value?.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">{params.value}</span>
          </div>
        );
      },
    },
    {
      headerName: "Email",
      field: "email",
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<ContactData, string>) => {
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
      cellRenderer: (params: ICellRendererParams<ContactData, string>) => {
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
      cellRenderer: (params: ICellRendererParams<ContactData, string>) => {
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
      headerName: "Lead",
      field: "leadName",
      minWidth: 150,
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
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Manage contact records</p>
        </div>
      </div>

      <DataTable
        title="All Contacts"
        data={contacts}
        columnDefs={columnDefs}
        loading={loading}
        searchPlaceholder="Search contacts..."
        emptyMessage="No contacts found. Contacts are created when you save extracted data from documents."
      />
    </div>
  );
}
