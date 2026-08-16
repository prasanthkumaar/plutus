import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

const origin =
  process.argv.slice(2).find((argument) => argument !== "--") ??
  "http://127.0.0.1:3000";
const endpoint = new URL("/mcp", `${origin}/`);
async function main() {
  const client = new Client({
    name: "plutus-verification-client",
    version: "1.0.0",
  });

  try {
    await client.connect(new StreamableHTTPClientTransport(endpoint));

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

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
