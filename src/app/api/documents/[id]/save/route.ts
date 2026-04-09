import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import { DocumentModel, LeadModel, CompanyModel, ContactModel, ActivityModel } from "@/server/models";
import { extractedDataSchema } from "@/server/schemas/extracted-data";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await connectToDatabase();
  const mongoose = await import("mongoose");

  try {
    await connectToDatabase();
    const { id } = await params;

    const document = await DocumentModel.findById(id);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = extractedDataSchema.parse(body);

    let companyId = null;
    if (validatedData.company) {
      let company = await CompanyModel.findOne({ name: validatedData.company });
      
      if (!company) {
        company = await CompanyModel.create({
          name: validatedData.company,
          domain: "",
          industry: "",
          notes: `Created from document: ${document.originalName}`,
        });
      }
      companyId = company._id;

      await ActivityModel.create({
        entityType: "company",
        entityId: company._id,
        action: "created",
        metadata: { source: "document", documentId: id },
      });
    }

    const lead = await LeadModel.create({
      fullName: validatedData.fullName || "Unknown",
      email: validatedData.email || "",
      phone: validatedData.phone || "",
      companyId,
      source: "document",
      status: "new",
      documentId: document._id,
      notes: validatedData.notes || "",
      tags: validatedData.tags || [],
    });

    await ActivityModel.create({
      entityType: "lead",
      entityId: lead._id,
      action: "created",
      metadata: { source: "document", documentId: id },
    });

    if (validatedData.fullName || validatedData.email || validatedData.phone) {
      const contact = await ContactModel.create({
        fullName: validatedData.fullName || "Unknown",
        email: validatedData.email || "",
        phone: validatedData.phone || "",
        companyId,
        leadId: lead._id,
      });

      await ActivityModel.create({
        entityType: "contact",
        entityId: contact._id,
        action: "created",
        metadata: { source: "lead", leadId: lead._id },
      });
    }

    await DocumentModel.findByIdAndUpdate(id, {
      parsedData: validatedData,
      validationErrors: [],
    });

    return NextResponse.json({
      success: true,
      message: "Data saved to CRM successfully",
      leadId: lead._id,
      companyId,
    });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to save data" },
      { status: 500 }
    );
  }
}
