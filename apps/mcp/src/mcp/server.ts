import type { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "mcp-handler";

import { registerEchoTool } from "@/src/mcp/tools/echo";

/** Registers every capability exposed by the Plutus MCP server. */
export function configureMcpServer(server: McpServer) {
  registerEchoTool(server);
}

/** Creates the provider-neutral MCP transport handler. */
export function createPlutusMcpHandler() {
  return createMcpHandler(configureMcpServer, {
    serverInfo: {
      name: "plutus",
      version: "0.1.0",
    },
  });
}
