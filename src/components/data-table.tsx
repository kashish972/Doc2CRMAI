"use client";

import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  type ColDef,
  type GridReadyEvent,
} from "ag-grid-community";
import { Search, Users, Download } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

interface DataTableProps<T> {
  title: string;
  data: T[];
  columnDefs: ColDef<T>[];
  loading: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  onExport?: () => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  title,
  data,
  columnDefs,
  loading,
  searchPlaceholder = "Search records...",
  onSearchChange,
  searchValue = "",
  onExport,
  emptyMessage = "No data found",
}: DataTableProps<T>) {
  const [quickFilterText, setQuickFilterText] = useState("");

  const defaultColDef = useMemo<ColDef<T>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
      cellStyle: {
        display: "flex",
        alignItems: "center",
        fontSize: "14px",
        lineHeight: "20px",
      },
    }),
    []
  );

  const onGridReady = (params: GridReadyEvent) => {
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 100);
  };

  const handleQuickFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuickFilterText(value);
    onSearchChange?.(value);
  };

  const filterText = searchValue || quickFilterText;

  return (
    <Card className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xl shadow-primary/5 transition-all duration-300">
      {/* Header */}
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
              <Users className="h-5 w-5 text-primary" />
            </div>

            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                {title}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading
                  ? "Loading records..."
                  : `${data.length} ${data.length === 1 ? "record" : "records"} available`}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={filterText}
                onChange={handleQuickFilter}
                className="h-11 rounded-xl border-border/60 bg-background pl-10 pr-4 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-11 rounded-xl border-border/60 px-4 shadow-sm hover:bg-primary/5"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-0">
        {loading ? (
          <div className="flex h-[560px] flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-muted/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-foreground">Loading data</p>
              <p className="text-xs text-muted-foreground">
                Please wait while we fetch your records...
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div
              className="ag-theme-quartz custom-ag-grid w-full"
              style={{ height: 560 }}
            >
              <AgGridReact<T>
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                quickFilterText={filterText}
                pagination
                paginationPageSize={15}
                paginationPageSizeSelector={[10, 15, 25, 50]}
                rowSelection="single"
                animateRows
                enableCellTextSelection
                rowHeight={72}
                headerHeight={56}
                suppressCellFocus={true}
                domLayout="normal"
              />
            </div>

            {data.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-[2px]">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/8 ring-1 ring-primary/10">
                  <Users className="h-9 w-9 text-primary/70" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Nothing to display
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {emptyMessage}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}