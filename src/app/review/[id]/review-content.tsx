"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Save,
  RefreshCw,
  ExternalLink,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { extractedDataSchema } from "@/server/schemas/extracted-data";

interface DocumentData {
  id: string;
  originalName: string;
  fileType: string;
  rawText: string;
  extractionStatus: string;
  llmModel: string;
  llmRawResponse: string;
  parsedData: {
    fullName?: string;
    email?: string;
    phone?: string;
    company?: string;
    documentType?: string;
    amount?: number | null;
    currency?: string;
    date?: string;
    notes?: string;
    tags?: string[];
    confidence?: number;
  } | null;
  validationErrors: string[];
}

export function ReviewContent({
  idPromise,
  shouldPrepareGoogleFormPromise,
}: {
  idPromise: Promise<{ id: string }>;
  shouldPrepareGoogleFormPromise?: Promise<boolean>;
}) {
  const searchParams = useSearchParams();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [prefilledGoogleFormUrl, setPrefilledGoogleFormUrl] = useState("");
  const [prefillSummary, setPrefillSummary] = useState<{
    matchedFields: Array<{
      entryId: string;
      label: string;
      extractedKey: string;
      value: string;
    }>;
    unmatchedFields: Array<{
      entryId: string;
      label: string;
    }>;
  } | null>(null);
  const [prefillingGoogleForm, setPrefillingGoogleForm] = useState(false);
  const [shouldPrepareGoogleForm, setShouldPrepareGoogleForm] = useState(false);
  const [creatingGoogleFormTemplate, setCreatingGoogleFormTemplate] = useState(false);
  const [creatingRealGoogleForm, setCreatingRealGoogleForm] = useState(false);
  const [googleFormTemplate, setGoogleFormTemplate] = useState<{
    title: string;
    description: string;
    createFormUrl: string;
    questions: Array<{
      label: string;
      type: string;
      suggestedValue: string;
    }>;
  } | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    documentType: "",
    amount: "",
    currency: "USD",
    date: "",
    notes: "",
    tags: "",
  });
  const [docId, setDocId] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const googleFormCreated = searchParams.get("googleFormCreated") === "1";
  const googleFormEditUrl = searchParams.get("googleFormEditUrl") || "";
  const googleFormResponderUrl = searchParams.get("googleFormResponderUrl") || "";
  const googleFormError = searchParams.get("googleFormError") || "";

  const fetchDocument = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`);
      console.log("Fetch response1:", response);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch document");
      }

      setDocument(data.document);

      if (data.document.parsedData) {
        setFormData({
          fullName: data.document.parsedData.fullName || "",
          email: data.document.parsedData.email || "",
          phone: data.document.parsedData.phone || "",
          company: data.document.parsedData.company || "",
          documentType: data.document.parsedData.documentType || "",
          amount: data.document.parsedData.amount?.toString() || "",
          currency: data.document.parsedData.currency || "USD",
          date: data.document.parsedData.date || "",
          notes: data.document.parsedData.notes || "",
          tags: (data.document.parsedData.tags || []).join(", "),
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    idPromise.then((params) => {
      setDocId(params.id);
      fetchDocument(params.id);
    });
  }, [idPromise, fetchDocument]);

  useEffect(() => {
    if (!shouldPrepareGoogleFormPromise) {
      return;
    }

    shouldPrepareGoogleFormPromise.then((value) => {
      setShouldPrepareGoogleForm(Boolean(value));
    });
  }, [shouldPrepareGoogleFormPromise]);

  const handleParse = async () => {
    setParsing(true);
    try {
      const response = await fetch(`/api/documents/${docId}/parse`, {
        method: "POST",
      });
      const data = await response.json();
      console.log("Parse response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Parsing failed");
      }

      setDocument((prev) =>
        prev
          ? {
              ...prev,
              extractionStatus: "completed",
              parsedData: data.parsedData,
              validationErrors: data.validationErrors,
            }
          : null
      );

      if (data.parsedData) {
        setFormData({
          fullName: data.parsedData.fullName || "",
          email: data.parsedData.email || "",
          phone: data.parsedData.phone || "",
          company: data.parsedData.company || "",
          documentType: data.parsedData.documentType || "",
          amount: data.parsedData.amount?.toString() || "",
          currency: data.parsedData.currency || "USD",
          date: data.parsedData.date || "",
          notes: data.parsedData.notes || "",
          tags: (data.parsedData.tags || []).join(", "),
        });
      }

      toast({
        title: "Parsing complete",
        description: data.validationErrors?.length
          ? "Parsed with some validation warnings"
          : "Successfully parsed document",
      });
    } catch (error) {
      toast({
        title: "Parsing failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        documentType: formData.documentType,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        currency: formData.currency,
        date: formData.date,
        notes: formData.notes,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        confidence: document?.parsedData?.confidence || 0,
      };

      extractedDataSchema.parse(parsedData);

      const response = await fetch(`/api/documents/${docId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Save failed");
      }

      toast({
        title: "Saved to CRM",
        description: "The data has been saved to your CRM",
      });

      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Save failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateGoogleFormPrefill = async () => {
    if (!googleFormUrl.trim()) {
      toast({
        title: "Google Form URL required",
        description: "Please paste a Google Form link first.",
        variant: "destructive",
      });
      return;
    }

    setPrefillingGoogleForm(true);

    try {
      const extractedDataPayload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        documentType: formData.documentType,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        currency: formData.currency,
        date: formData.date,
        notes: formData.notes,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        confidence: document?.parsedData?.confidence || 0,
      };

      const response = await fetch("/api/google-form/prefill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formUrl: googleFormUrl,
          extractedData: extractedDataPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create prefilled Google Form");
      }

      setPrefilledGoogleFormUrl(data.prefilledUrl || "");
      setPrefillSummary({
        matchedFields: data.matchedFields || [],
        unmatchedFields: data.unmatchedFields || [],
      });

      toast({
        title: "Google Form prefilled",
        description: "Preview is ready. Open the link to review and submit.",
      });
    } catch (error) {
      toast({
        title: "Prefill failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setPrefillingGoogleForm(false);
    }
  };

  const handleCreateGoogleFormTemplate = useCallback(async () => {
    setCreatingGoogleFormTemplate(true);

    try {
      const extractedDataPayload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        documentType: formData.documentType,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        currency: formData.currency,
        date: formData.date,
        notes: formData.notes,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        confidence: document?.parsedData?.confidence || 0,
      };

      const response = await fetch("/api/google-form/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedData: extractedDataPayload }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create Google Form template");
      }

      setGoogleFormTemplate(data.template || null);

      toast({
        title: "Google Form template ready",
        description: "Open Google Forms and add the generated questions.",
      });
    } catch (error) {
      toast({
        title: "Template generation failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setCreatingGoogleFormTemplate(false);
    }
  }, [
    formData.fullName,
    formData.email,
    formData.phone,
    formData.company,
    formData.documentType,
    formData.amount,
    formData.currency,
    formData.date,
    formData.notes,
    formData.tags,
    document?.parsedData?.confidence,
    toast,
  ]);

  const handleCreateRealGoogleForm = () => {
    if (!docId) {
      toast({
        title: "Document not ready",
        description: "Please wait until the document is loaded.",
        variant: "destructive",
      });
      return;
    }

    setCreatingRealGoogleForm(true);
    window.location.assign(`/api/google-form/oauth/start?documentId=${docId}`);
  };

  useEffect(() => {
    if (!shouldPrepareGoogleForm || !document?.parsedData) {
      return;
    }

    if (!googleFormTemplate && !creatingGoogleFormTemplate) {
      void handleCreateGoogleFormTemplate();
    }
  }, [
    shouldPrepareGoogleForm,
    document?.parsedData,
    googleFormTemplate,
    creatingGoogleFormTemplate,
    handleCreateGoogleFormTemplate,
  ]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium">Document not found</p>
          <Button
            variant="link"
            onClick={() => router.push("/dashboard")}
            className="mt-2"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    processing: "bg-blue-500",
    completed: "bg-green-500",
    failed: "bg-red-500",
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Review Document
            </h1>
            <p className="text-muted-foreground">{document.originalName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${statusColors[document.extractionStatus]} text-white`}>
              {document.extractionStatus}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Extracted Text
              </CardTitle>
            </CardHeader>
            <CardContent>
              
              {document.extractionStatus === "pending" ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Click &quot;Parse with AI&quot; to extract data
                  </p>
                  <Button onClick={handleParse} disabled={parsing}>
                    {parsing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Parse with AI
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                 <div className="rounded-lg bg-gray-50 p-4 max-h-[606px] overflow-auto">
  <p className="text-sm whitespace-pre-wrap break-words">
    {document.rawText || "No text extracted"}
  </p>
</div>
                  {document.extractionStatus !== "pending" && (
                    <Button onClick={handleParse} disabled={parsing} className="w-full">
                      {parsing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Re-parse with AI
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extracted Data</CardTitle>
              {document.parsedData?.confidence !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Confidence</span>
                    <span>
                      {Math.round(document.parsedData.confidence * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={document.parsedData.confidence * 100}
                    className="h-2"
                  />
                </div>
              )}
              {document.validationErrors?.length > 0 && (
                <div className="mt-2 rounded-lg bg-yellow-50 p-3">
                  <p className="text-xs font-medium text-yellow-800">
                    Validation Warnings:
                  </p>
                  <ul className="mt-1 list-inside list-disc text-xs text-yellow-700">
                    {document.validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {googleFormCreated && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-800">
                  <p className="font-semibold">Google Form created successfully.</p>
                  {googleFormEditUrl && (
                    <a
                      href={googleFormEditUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block font-medium underline"
                    >
                      Open edit form
                    </a>
                  )}
                  {googleFormResponderUrl && (
                    <a
                      href={googleFormResponderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block font-medium underline"
                    >
                      Open live form
                    </a>
                  )}
                </div>
              )}

              {googleFormError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-800">
                  <p className="font-semibold">Google Form creation failed.</p>
                  <p className="mt-1">{googleFormError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Acme Inc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type</Label>
                  <Input
                    id="documentType"
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleInputChange}
                    placeholder="Invoice"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    placeholder="USD"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="invoice, urgent, Q1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving to CRM...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save to CRM
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="default"
                className="w-full"
                onClick={handleCreateRealGoogleForm}
                disabled={creatingRealGoogleForm}
              >
                {creatingRealGoogleForm ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting to Google...
                  </>
                ) : (
                  "Create Real Google Form"
                )}
              </Button>

              <div className="space-y-3 rounded-lg border border-dashed p-4">
                <p className="text-sm font-medium">Auto-fill Google Form</p>
                <p className="text-xs text-muted-foreground">
                  Paste a Google Form link to generate a prefilled form from extracted data.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="googleFormUrl">Google Form URL</Label>
                  <Input
                    id="googleFormUrl"
                    value={googleFormUrl}
                    onChange={(e) => setGoogleFormUrl(e.target.value)}
                    placeholder="https://docs.google.com/forms/.../viewform"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleGenerateGoogleFormPrefill}
                  disabled={prefillingGoogleForm}
                >
                  {prefillingGoogleForm ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Building prefilled link...
                    </>
                  ) : (
                    "Generate Prefilled Google Form"
                  )}
                </Button>

                {prefilledGoogleFormUrl && (
                  <div className="space-y-3 rounded-md bg-muted/40 p-3">
                    <a
                      href={prefilledGoogleFormUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      Open Prefilled Form
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>

                    {prefillSummary && (
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p>
                          Mapped {prefillSummary.matchedFields.length} fields
                          {prefillSummary.unmatchedFields.length > 0
                            ? `, ${prefillSummary.unmatchedFields.length} unmatched`
                            : ""}
                          .
                        </p>
                        {prefillSummary.unmatchedFields.length > 0 && (
                          <p>
                            Some questions could not be auto-mapped. Open the form and complete them manually.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="h-80 overflow-hidden rounded-md border bg-white">
                      <iframe
                        title="Prefilled Google Form Preview"
                        src={prefilledGoogleFormUrl}
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-dashed p-4">
                <p className="text-sm font-medium">Create Google Form from Extracted Fields</p>
                <p className="text-xs text-muted-foreground">
                  Generate a question template from extracted data, then open Google Forms to create the form.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleCreateGoogleFormTemplate}
                  disabled={creatingGoogleFormTemplate}
                >
                  {creatingGoogleFormTemplate ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating template...
                    </>
                  ) : (
                    "Create Form Template"
                  )}
                </Button>

                {googleFormTemplate && (
                  <div className="space-y-3 rounded-md bg-muted/40 p-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{googleFormTemplate.title}</p>
                      <p className="text-xs text-muted-foreground">{googleFormTemplate.description}</p>
                    </div>

                    <a
                      href={googleFormTemplate.createFormUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      Open New Google Form
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>

                    <div className="max-h-64 space-y-2 overflow-auto rounded border bg-white p-3">
                      {googleFormTemplate.questions.map((question, index) => (
                        <div key={`${question.label}-${index}`} className="rounded border p-2">
                          <p className="text-xs font-semibold text-foreground">
                            {index + 1}. {question.label} ({question.type})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Suggested value: {question.suggestedValue || "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
