import { z } from "zod";

export const industryRegister = [
  {
    name: "Rörmokeri",
    services: "Läckor, stopp i avlopp, badrumsrenovering samt installation och service av vatten och värme",
  },
  {
    name: "Elektriker",
    services: "Elinstallationer, felsökning, belysning, elcentraler och laddboxar",
  },
  {
    name: "Bygg och snickeri",
    services: "Renoveringar, köksmontage, altaner, reparationer och snickerier",
  },
  {
    name: "Måleri",
    services: "Invändigt och utvändigt måleri, tapetsering samt spackling",
  },
  {
    name: "Städ och hemstäd",
    services: "Hemstädning, kontorsstädning, flyttstädning och fönsterputs",
  },
  {
    name: "Flytt och transport",
    services: "Flytthjälp, packning, möbeltransport och bärhjälp",
  },
  {
    name: "Trädgård och utemiljö",
    services: "Gräsklippning, häckklippning, beskärning, ogräsrensning och trädgårdsanläggning",
  },
  {
    name: "Fastighetsservice",
    services: "Fastighetsskötsel, reparationer, underhåll och snöröjning",
  },
  {
    name: "Golv",
    services: "Golvslipning, golvläggning och reparation av golv",
  },
  {
    name: "Tak och plåt",
    services: "Taktvätt, takbyte, takreparationer och plåtslageri",
  },
  {
    name: "Badrum och kakel",
    services: "Badrumsrenovering, kakel, klinker och våtrumsarbete",
  },
  {
    name: "Lås och säkerhet",
    services: "Låsöppning, låsbyte, säkerhetslås och nyckelservice",
  },
] as const;

export const swedishCounties = [
  "Blekinge län",
  "Dalarnas län",
  "Gotlands län",
  "Gävleborgs län",
  "Hallands län",
  "Jämtlands län",
  "Jönköpings län",
  "Kalmar län",
  "Kronobergs län",
  "Norrbottens län",
  "Skåne län",
  "Stockholms län",
  "Södermanlands län",
  "Uppsala län",
  "Värmlands län",
  "Västerbottens län",
  "Västernorrlands län",
  "Västmanlands län",
  "Västra Götalands län",
  "Örebro län",
  "Östergötlands län",
] as const;

export function getIndustryServices(industry: string) {
  return industryRegister.find((entry) => entry.name === industry)?.services ?? "";
}

export const companyInputSchema = z.object({
  companyName: z.string().trim().min(2, "Ange företagets namn").max(100, "Företagsnamnet får vara högst 100 tecken"),
  contactName: z.string().trim().min(2, "Ange kontaktpersonens förnamn").max(60, "Förnamnet får vara högst 60 tecken"),
  industry: z.string().trim().min(2, "Välj företagets bransch").max(80, "Branschen får vara högst 80 tecken"),
  city: z.string().trim().min(2, "Välj företagets ort").max(80, "Orten får vara högst 80 tecken"),
  services: z.string().trim().min(5, "Välj bransch så fylls tjänsterna i automatiskt").max(2000, "Beskrivningen får vara högst 2 000 tecken"),
  serviceArea: z.string().trim().min(2, "Välj företagets ort").max(160, "Serviceområdet får vara högst 160 tecken"),
  tone: z.enum(["Rak", "Varm", "Lugn"]),
  urgentInstructions: z.string().trim().max(2000, "Instruktionerna får vara högst 2 000 tecken"),
  consent: z.boolean().refine((value) => value, "Du behöver godkänna metadataöverföringen för att starta rösttestet"),
});

export type CompanyInput = z.input<typeof companyInputSchema>;

export const emptyCompanyInput: CompanyInput = {
  companyName: "",
  contactName: "",
  industry: "",
  city: "",
  services: "",
  serviceArea: "",
  tone: "Rak",
  urgentInstructions: "",
  consent: false,
};

export const exampleCompanyInput: CompanyInput = {
  companyName: "Lindqvists Rör",
  contactName: "Erik",
  industry: "Rörmokeri",
  city: "Uppsala län",
  services: getIndustryServices("Rörmokeri"),
  serviceArea: "Uppsala län",
  tone: "Varm",
  urgentInstructions: "Vid fara för liv eller brand, be kunden ringa 112.",
  consent: true,
};
