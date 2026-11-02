import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { companyProfiles } from "@db/schema";
import type { CompanyInput } from "@contracts/company";
import { getDb } from "./connection";

const publicColumns = {
  publicId: companyProfiles.publicId,
  companyName: companyProfiles.companyName,
  contactName: companyProfiles.contactName,
  industry: companyProfiles.industry,
  city: companyProfiles.city,
  services: companyProfiles.services,
  serviceArea: companyProfiles.serviceArea,
  tone: companyProfiles.tone,
  urgentInstructions: companyProfiles.urgentInstructions,
  createdAt: companyProfiles.createdAt,
};

export async function createCompanyProfile(input: CompanyInput) {
  const publicId = randomUUID();
  const db = getDb();
  await db.insert(companyProfiles).values({
    publicId,
    companyName: input.companyName,
    contactName: input.contactName,
    industry: input.industry,
    city: input.city,
    services: input.services,
    serviceArea: input.serviceArea,
    tone: input.tone,
    urgentInstructions: input.urgentInstructions || null,
  });
  const [profile] = await db
    .select(publicColumns)
    .from(companyProfiles)
    .where(eq(companyProfiles.publicId, publicId))
    .limit(1);
  if (!profile) throw new Error("Demoprofilen kunde inte läsas efter sparning");
  return profile;
}

export async function findCompanyProfile(publicId: string) {
  const [profile] = await getDb()
    .select(publicColumns)
    .from(companyProfiles)
    .where(eq(companyProfiles.publicId, publicId))
    .limit(1);
  return profile ?? null;
}
