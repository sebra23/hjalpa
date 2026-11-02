import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const companyProfiles = mysqlTable("company_profiles", {
  id: serial("id").primaryKey(),
  publicId: varchar("public_id", { length: 36 }).notNull().unique(),
  companyName: varchar("company_name", { length: 100 }).notNull(),
  contactName: varchar("contact_name", { length: 60 }).notNull(),
  industry: varchar("industry", { length: 80 }).notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  services: text("services").notNull(),
  serviceArea: varchar("service_area", { length: 160 }).notNull(),
  tone: mysqlEnum("tone", ["Rak", "Varm", "Lugn"]).notNull(),
  urgentInstructions: text("urgent_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
