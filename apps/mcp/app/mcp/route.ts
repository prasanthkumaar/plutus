import { verifyClerkToken } from "@clerk/mcp-tools/next";
import { auth } from "@clerk/nextjs/server";
import { withMcpAuth } from "mcp-handler";

import { createShMcpHandler } from "@/src/mcp/server";

const handler = createShMcpHandler();

const authHandler = withMcpAuth(
  handler,
  async (_, token) => {
    const clerkAuth = await auth({ acceptsToken: "oauth_token" });
    return verifyClerkToken(clerkAuth, token);
  },
  {
    required: true,
    resourceMetadataPath: "/.well-known/oauth-protected-resource/mcp",
  },
);

export { authHandler as POST };
