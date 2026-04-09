"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  Building2,
  Contact,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  Plus,
  Activity,
} from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalDocuments: number;
    totalLeads: number;
    totalCompanies: number;
    totalContacts: number;
  };
  recentDocuments: Array<{
    id: string;
    originalName: string;
    fileType: string;
    extractionStatus: string;
    createdAt: string;
  }>;
  recentLeads: Array<{
    id: string;
    fullName: string;
    email: string;
    status: string;
    createdAt: string;
  }>;
  leadsByStatus: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
}

const statCards = [
  { name: "Total Documents", key: "totalDocuments", icon: FileText, color: "from-blue-500 to-blue-600", bgColor: "bg-blue-500/10" },
  { name: "Total Leads", key: "totalLeads", icon: Users, color: "from-violet-500 to-violet-600", bgColor: "bg-violet-500/10" },
  { name: "Companies", key: "totalCompanies", icon: Building2, color: "from-emerald-500 to-emerald-600", bgColor: "bg-emerald-500/10" },
  { name: "Contacts", key: "totalContacts", icon: Contact, color: "from-orange-500 to-orange-600", bgColor: "bg-orange-500/10" },
];

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

const extractionStatusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalDocuments: 0,
    totalLeads: 0,
    totalCompanies: 0,
    totalContacts: 0,
  };

  const statsArray = [
    { name: "Total Documents", value: stats.totalDocuments, icon: FileText, color: "blue-500", bgColor: "bg-blue-500/10" },
    { name: "Total Leads", value: stats.totalLeads, icon: Users, color: "violet-500", bgColor: "bg-violet-500/10" },
    { name: "Companies", value: stats.totalCompanies, icon: Building2, color: "emerald-500", bgColor: "bg-emerald-500/10" },
    { name: "Contacts", value: stats.totalContacts, icon: Contact, color: "orange-500", bgColor: "bg-orange-500/10" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-secondary/30 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Sparkles className="mr-1.5 h-4 w-4" />
                AI-Powered CRM
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Overview of your document processing and CRM activities
            </p>
          </div>
          <Link href="/upload">
            <Button className="gap-2 shadow-lg shadow-primary/25">
              <Plus className="h-4 w-4" />
              Upload Document
            </Button>
          </Link>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsArray.map((stat, index) => (
            <Card 
              key={stat.name} 
              className="relative overflow-hidden border-0 shadow-lg bg-white"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-background to-secondary/30" />
              <CardContent className="relative flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.value === 0 ? "No data yet" : `${stat.value} total`}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                 <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card 
            className="relative overflow-hidden border-0 shadow-lg shadow-primary/5 animate-slide-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                Recent Documents
              </CardTitle>
              <Link
                href="/crm/documents"
                className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="relative">
              {data?.recentDocuments?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 rounded-full bg-secondary p-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No documents yet</p>
                  <Link href="/upload" className="mt-2 text-sm text-primary hover:underline font-medium">
                    Upload your first document
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.recentDocuments?.slice(0, 5).map((doc, index) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border p-3 transition-all hover:shadow-md animate-fade-in"
                      style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{doc.originalName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`${extractionStatusColors[doc.extractionStatus]} text-white text-xs`}
                      >
                        {doc.extractionStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card 
            className="relative overflow-hidden border-0 shadow-lg shadow-primary/5 animate-slide-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Users className="h-4 w-4 text-violet-500" />
                </div>
                Recent Leads
              </CardTitle>
              <Link
                href="/crm/leads"
                className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="relative">
              {data?.recentLeads?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 rounded-full bg-secondary p-3">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No leads yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a document to create leads
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.recentLeads?.slice(0, 5).map((lead, index) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between rounded-xl border p-3 transition-all hover:shadow-md animate-fade-in"
                      style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold text-sm">
                          {lead.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{lead.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead.email || "No email"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`${statusColors[lead.status]} text-white text-xs`}
                      >
                        {statusLabels[lead.status] || lead.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card 
          className="mt-6 relative overflow-hidden border-0 shadow-lg shadow-primary/5 animate-slide-in"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <Activity className="h-4 w-4 text-green-500" />
              </div>
              Leads by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(data?.leadsByStatus || {}).map(([status, count], index) => (
                <div
                  key={status}
                  className="flex flex-col items-center rounded-xl border p-4 transition-all hover:shadow-md animate-fade-in"
                  style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                >
                  <div
                    className={`mb-3 h-3 w-3 rounded-full ${statusColors[status]} shadow-lg shadow-current/20`}
                  />
                  <span className="text-3xl font-bold">{count}</span>
                  <span className="text-xs font-medium text-muted-foreground mt-1">
                    {statusLabels[status]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
