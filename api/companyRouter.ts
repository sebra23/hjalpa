import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { companyInputSchema } from "@contracts/company";
import { createRouter, publicQuery } from "./middleware";
import { createCompanyProfile, findCompanyProfile } from "./queries/companyProfiles";

export const companyRouter = createRouter({
  create: publicQuery
    .input(companyInputSchema)
    .mutation(({ input }) => createCompanyProfile(input)),
  byId: publicQuery
    .input(z.object({ publicId: z.string().uuid() }))
    .query(async ({ input }) => {
      const profile = await findCompanyProfile(input.publicId);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Demoprofilen hittades inte" });
      }
      return profile;
    }),
});
