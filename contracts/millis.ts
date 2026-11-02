import type { CompanyInput } from "./company";

export const MILLIS_AGENT_ID = "-P4hwwbfFSEv7dCJJ1s1";

export function getMillisMetadata(profile: CompanyInput, publicId?: string) {
  return {
    foretagsnamn: profile.companyName,
    kontaktperson: profile.contactName,
    bransch: profile.industry,
    ort: profile.city,
    tjanster: profile.services,
    serviceomrade: profile.serviceArea,
    ton: profile.tone,
    akutinstruktioner: profile.urgentInstructions || "Vid fara för liv eller brand, be kunden ringa 112.",
    demo: "true",
    ...(publicId ? { profil_id: publicId } : {}),
  };
}
