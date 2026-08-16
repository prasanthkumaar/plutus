import { createMcpHandler } from "mcp-handler";

import { configureMcpServer } from "@/src/server";

/** Creates the provider-neutral MCP transport handler. */
export function createPlutusMcpHandler() {
  return createMcpHandler(configureMcpServer, {
    serverInfo: {
      name: "plutus",
      version: "0.1.0",
    },
  });
}
