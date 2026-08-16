import { createMcpHandler, withMcpAuth } from "mcp-handler";

import {
  foundationScope,
  protectedResourceMetadataPath,
} from "@/src/auth/constants";
import { verifyAuth0AccessToken } from "@/src/auth/verify-token";
import { configureMcpServer } from "@/src/server";

const handler = createMcpHandler(configureMcpServer, {
  serverInfo: {
    name: "plutus",
    version: "0.1.0",
  },
});

const authenticatedHandler = withMcpAuth(handler, verifyAuth0AccessToken, {
  required: true,
  requiredScopes: [foundationScope],
  resourceMetadataPath: protectedResourceMetadataPath,
});

export { authenticatedHandler as GET, authenticatedHandler as POST };
