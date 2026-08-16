import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

const origin =
  process.argv.slice(2).find((argument) => argument !== "--") ??
  "http://127.0.0.1:3000";
const endpoint = new URL("/mcp", `${origin}/`);

async function main() {
  const accessToken = process.env.PLUTUS_MCP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "PLUTUS_MCP_ACCESS_TOKEN is required for MCP verification",
    );
  }

  const client = new Client({
    name: "plutus-verification-client",
    version: "1.0.0",
  });

  try {
    await client.connect(
      new StreamableHTTPClientTransport(endpoint, {
        authProvider: { token: async () => accessToken },
      }),
    );

    const { tools } = await client.listTools();
    const result = await client.callTool({
      name: "echo",
      arguments: { message: "Hello from the Plutus verification client" },
    });

    console.log("Endpoint:", endpoint.toString());
    console.log("Tools:", tools.map(({ name }) => name).join(", "));
    console.log("Echo result:", result.structuredContent);
  } finally {
    await client.close();
  }
}

function getSafeErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "MCP verification failed";
  const accessToken = process.env.PLUTUS_MCP_ACCESS_TOKEN;

  return accessToken ? message.replaceAll(accessToken, "[redacted]") : message;
}

main().catch((error: unknown) => {
  console.error(getSafeErrorMessage(error));
  process.exitCode = 1;
});
