import { createRouter, publicQuery } from "./middleware";
import { companyRouter } from "./companyRouter";
import { chatRouter } from "./chatRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  company: companyRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
