import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { after, before, test } from "node:test";

import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

const host = "127.0.0.1";
const serverReadyTimeoutMs = 30_000;

type StartedApplication = {
  origin: string;
  stop: () => Promise<void>;
};

async function findAvailablePort() {
  const server = createServer();
  server.listen(0, host);
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not allocate a local test port");
  }

  const { port } = address;
  server.close();
  await once(server, "close");
  return port;
}

async function waitForServer(origin: string, processLogs: string[]) {
  const deadline = Date.now() + serverReadyTimeoutMs;

  while (Date.now() < deadline) {
    try {
      await fetch(origin);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error(`Next.js did not start in time.\n${processLogs.join("")}`);
}

async function stopProcess(application: ChildProcess) {
  if (application.exitCode !== null) {
    return;
  }

  application.kill("SIGTERM");
  await once(application, "exit");
}

async function startApplication(): Promise<StartedApplication> {
  const port = await findAvailablePort();
  const origin = `http://${host}:${port}`;
  const processLogs: string[] = [];
  const nextBin = new URL("../node_modules/next/dist/bin/next", import.meta.url);
  const application = spawn(
    process.execPath,
    [nextBin.pathname, "dev", "--hostname", host, "--port", String(port)],
    {
      cwd: new URL("../", import.meta.url),
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  application.stdout.on("data", (chunk) => processLogs.push(chunk.toString()));
  application.stderr.on("data", (chunk) => processLogs.push(chunk.toString()));

  try {
    await waitForServer(origin, processLogs);
  } catch (error) {
    await stopProcess(application);
    throw error;
  }

  return {
    origin,
    stop: () => stopProcess(application),
  };
}

async function connectClient(origin: string) {
  const client = new Client({
    name: "plutus-integration-test",
    version: "1.0.0",
  });
  const transport = new StreamableHTTPClientTransport(
    new URL("/mcp", origin),
  );
  await client.connect(transport);
  return client;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

let application: StartedApplication | undefined;
let client: Client | undefined;

before(async () => {
  application = await startApplication();
  client = await connectClient(application.origin);
});

after(async () => {
  await client?.close();
  await application?.stop();
});

test("a client can discover and invoke the bounded echo tool over HTTP", async () => {
  assert.ok(client);

  const { tools } = await client.listTools();
  assert.deepEqual(
    tools.map(({ name }) => name),
    ["echo"],
  );

  const result = await client.callTool({
    name: "echo",
    arguments: { message: "Hello from Plutus" },
  });
  assert.deepEqual(result.content, [
    { type: "text", text: "Tool echo: Hello from Plutus" },
  ]);
  assert.deepEqual(result.structuredContent, {
    message: "Hello from Plutus",
  });
});

test("the published schema rejects invalid echo input over HTTP", async () => {
  assert.ok(client);

  const { tools } = await client.listTools();
  const echoTool = tools.find(({ name }) => name === "echo");
  assert.ok(echoTool);
  assert.ok(isRecord(echoTool.inputSchema.properties));

  const messageSchema = echoTool.inputSchema.properties.message;
  assert.ok(isRecord(messageSchema));
  assert.equal(messageSchema.minLength, 1);
  assert.equal(messageSchema.maxLength, 100);

  for (const message of ["", "x".repeat(101)]) {
    const result = await client.callTool({
      name: "echo",
      arguments: { message },
    });
    assert.equal(result.isError, true);
  }
});
