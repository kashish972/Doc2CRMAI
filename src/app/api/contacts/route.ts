import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import { ContactModel } from "@/server/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const contacts = await ContactModel.find(query)
      .populate("companyId", "name")
      .populate("leadId", "fullName status")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      contacts: contacts.map((contact) => ({
        id: contact._id,
        fullName: contact.fullName,
        email: contact.email,
        phone: contact.phone,
        companyId: contact.companyId,
        companyName: (contact.companyId as { name: string })?.name || null,
        leadId: contact.leadId,
        leadName: (contact.leadId as { fullName: string })?.fullName || null,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get contacts error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get contacts" },
      { status: 500 }
    );
  }
}
