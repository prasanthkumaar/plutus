import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

const echoInputSchema = z
  .object({
    message: z
      .string()
      .min(1)
      .max(100)
      .describe("Message to echo back"),
  })
  .strict();

const echoOutputSchema = z
  .object({
    message: z.string().describe("Echoed message"),
  })
  .strict();

/** Registers the bounded echo tool used to verify the MCP foundation. */
export function registerEchoTool(server: McpServer) {
  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Echo a message",
      inputSchema: echoInputSchema,
      outputSchema: echoOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ message }) => ({
      content: [{ type: "text", text: `Tool echo: ${message}` }],
      structuredContent: { message },
    }),
  );
}
