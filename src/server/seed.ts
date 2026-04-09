import { connectToDatabase } from "./db";
import { DocumentModel, LeadModel, CompanyModel, ContactModel, ActivityModel } from "./models";

async function seed() {
  console.log("Connecting to database...");
  await connectToDatabase();

  console.log("Clearing existing data...");
  await Promise.all([
    DocumentModel.deleteMany({}),
    LeadModel.deleteMany({}),
    CompanyModel.deleteMany({}),
    ContactModel.deleteMany({}),
    ActivityModel.deleteMany({}),
  ]);

  console.log("Creating sample companies...");
  const companies = await CompanyModel.insertMany([
    { name: "Acme Corporation", domain: "acme.com", industry: "Technology", notes: "Fortune 500 company" },
    { name: "TechStart Inc", domain: "techstart.io", industry: "Software", notes: "Startup client" },
    { name: "Global Industries", domain: "global.com", industry: "Manufacturing", notes: "Enterprise client" },
  ]);

  console.log("Creating sample leads...");
  const leads = await LeadModel.insertMany([
    {
      fullName: "John Smith",
      email: "john.smith@acme.com",
      phone: "+1 555 123 4567",
      companyId: companies[0]._id,
      source: "website",
      status: "qualified",
      notes: "Interested in enterprise plan",
      tags: ["enterprise", "hot"],
    },
    {
      fullName: "Sarah Johnson",
      email: "sarah@techstart.io",
      phone: "+1 555 234 5678",
      companyId: companies[1]._id,
      source: "referral",
      status: "new",
      notes: "Startup founder",
      tags: ["startup", "vip"],
    },
    {
      fullName: "Michael Brown",
      email: "m.brown@global.com",
      phone: "+1 555 345 6789",
      companyId: companies[2]._id,
      source: "document",
      status: "converted",
      notes: "Signed contract",
      tags: ["converted", "enterprise"],
    },
  ]);

  console.log("Creating sample contacts...");
  await ContactModel.insertMany([
    {
      fullName: "John Smith",
      email: "john.smith@acme.com",
      phone: "+1 555 123 4567",
      companyId: companies[0]._id,
      leadId: leads[0]._id,
    },
    {
      fullName: "Sarah Johnson",
      email: "sarah@techstart.io",
      phone: "+1 555 234 5678",
      companyId: companies[1]._id,
      leadId: leads[1]._id,
    },
    {
      fullName: "Michael Brown",
      email: "m.brown@global.com",
      phone: "+1 555 345 6789",
      companyId: companies[2]._id,
      leadId: leads[2]._id,
    },
  ]);

  console.log("Creating sample activities...");
  await ActivityModel.insertMany([
    {
      entityType: "lead",
      entityId: leads[0]._id,
      action: "created",
      metadata: { source: "website" },
    },
    {
      entityType: "lead",
      entityId: leads[1]._id,
      action: "created",
      metadata: { source: "referral" },
    },
    {
      entityType: "lead",
      entityId: leads[2]._id,
      action: "converted",
      metadata: { newStatus: "converted" },
    },
    {
      entityType: "company",
      entityId: companies[0]._id,
      action: "created",
      metadata: { source: "manual" },
    },
  ]);

  console.log("Creating sample documents...");
  await DocumentModel.insertMany([
    {
      originalName: "invoice_acme_2024.pdf",
      fileType: "pdf",
      rawText: "INVOICE\nInvoice Number: INV-001\nDate: 2024-01-15\nAmount: $5,000\nCompany: Acme Corporation",
      extractionStatus: "completed",
      llmModel: "openai/gpt-3.5-turbo",
      llmRawResponse: '{"fullName":"John Smith","email":"john.smith@acme.com","company":"Acme Corporation","amount":5000,"currency":"USD"}',
      parsedData: {
        fullName: "John Smith",
        email: "john.smith@acme.com",
        company: "Acme Corporation",
        amount: 5000,
        currency: "USD",
        documentType: "Invoice",
        confidence: 0.95,
      },
      validationErrors: [],
    },
  ]);

  console.log("Seed completed successfully!");
  console.log(`- ${companies.length} companies created`);
  console.log(`- ${leads.length} leads created`);
  console.log("- 3 contacts created");
  console.log("- 4 activities created");
  console.log("- 1 document created");

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
