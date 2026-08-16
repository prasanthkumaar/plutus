import { z } from "zod";

const oauthConfigSchema = z.object({
  audience: z.url(),
  issuer: z.url(),
});

/** Reads the server-only OAuth resource-server configuration. */
export function getOAuthConfig() {
  return oauthConfigSchema.parse({
    audience: process.env.AUTH0_AUDIENCE,
    issuer: process.env.AUTH0_ISSUER,
  });
}
