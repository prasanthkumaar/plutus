import type { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler as createMcpTransportHandler } from "mcp-handler";

import { registerEchoTool } from "@/src/mcp/tools/echo";

/** Registers every capability exposed by the MCP server. */
export function configureMcpServer(server: McpServer) {
  registerEchoTool(server);
}

/** Creates the provider-neutral MCP transport handler. */
export function createMcpHandler() {
  return createMcpTransportHandler(configureMcpServer, {
    serverInfo: {
      name: "sh",
      version: "0.1.0",
    },
  });
}
