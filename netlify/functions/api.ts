import app from "../../api/app";

export default async (request: Request): Promise<Response> => app.fetch(request);

export const config = {
  path: "/api/*",
};
