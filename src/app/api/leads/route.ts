import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import { LeadModel } from "@/server/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    
    if (status && status !== "all") {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const leads = await LeadModel.find(query)
      .populate("companyId", "name")
      .populate("documentId", "originalName")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      leads: leads.map((lead) => ({
        id: lead._id,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        companyId: lead.companyId,
        companyName: (lead.companyId as { name: string })?.name || null,
        source: lead.source,
        status: lead.status,
        documentId: lead.documentId,
        documentName: (lead.documentId as { originalName: string })?.originalName || null,
        notes: lead.notes,
        tags: lead.tags,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get leads error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get leads" },
      { status: 500 }
    );
  }
}
