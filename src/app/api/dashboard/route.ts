import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import { DocumentModel, LeadModel, CompanyModel, ContactModel } from "@/server/models";

export async function GET() {
  try {
    await connectToDatabase();

    const [
      totalDocuments,
      totalLeads,
      totalCompanies,
      totalContacts,
      recentDocuments,
      recentLeads,
      leadsByStatus,
    ] = await Promise.all([
      DocumentModel.countDocuments(),
      LeadModel.countDocuments(),
      CompanyModel.countDocuments(),
      ContactModel.countDocuments(),
      DocumentModel.find().sort({ createdAt: -1 }).limit(5).lean(),
      LeadModel.find().sort({ createdAt: -1 }).limit(5).lean(),
      LeadModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts = {
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      lost: 0,
    };

    leadsByStatus.forEach((item: { _id: string; count: number }) => {
      if (item._id in statusCounts) {
        statusCounts[item._id as keyof typeof statusCounts] = item.count;
      }
    });

    return NextResponse.json({
      stats: {
        totalDocuments,
        totalLeads,
        totalCompanies,
        totalContacts,
      },
      recentDocuments: recentDocuments.map((doc) => ({
        id: doc._id,
        originalName: doc.originalName,
        fileType: doc.fileType,
        extractionStatus: doc.extractionStatus,
        createdAt: doc.createdAt,
      })),
      recentLeads: recentLeads.map((lead) => ({
        id: lead._id,
        fullName: lead.fullName,
        email: lead.email,
        status: lead.status,
        createdAt: lead.createdAt,
      })),
      leadsByStatus: statusCounts,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get dashboard data" },
      { status: 500 }
    );
  }
}
