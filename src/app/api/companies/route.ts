import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import { CompanyModel } from "@/server/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { domain: { $regex: search, $options: "i" } },
        { industry: { $regex: search, $options: "i" } },
      ];
    }

    const companies = await CompanyModel.find(query)
      .populate({
        path: "contacts",
        select: "fullName email phone",
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      companies: companies.map((company) => ({
        id: company._id,
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        notes: company.notes,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get companies error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get companies" },
      { status: 500 }
    );
  }
}
