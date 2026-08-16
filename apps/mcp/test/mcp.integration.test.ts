import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer as createHttpServer, type Server } from "node:http";
import { createServer as createNetServer } from "node:net";
import { after, before, test } from "node:test";

import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  type CryptoKey,
} from "jose";

const host = "127.0.0.1";
const serverReadyTimeoutMs = 30_000;
const testAudience = "https://plutus.example/mcp";
const testOwnerSubject = "google-oauth2|plutus-owner";
const foundationScope = "access:plutus";
const signingAlgorithm = "RS256";
const signingKeyId = "plutus-integration-test-key";

let testAuth0Issuer: string;
let signingKey: CryptoKey;

type StartedApplication = {
  origin: string;
  stop: () => Promise<void>;
};

type StartedAuthorizationServer = {
  stop: () => Promise<void>;
};

async function findAvailablePort() {
  const server = createNetServer();
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

async function startAuthorizationServer(
  publicKey: Awaited<ReturnType<typeof exportJWK>>,
): Promise<StartedAuthorizationServer> {
  const server = createHttpServer((request, response) => {
    if (request.url !== "/.well-known/jwks.json") {
      response.writeHead(404).end();
      return;
    }

    response
      .writeHead(200, { "content-type": "application/json" })
      .end(
        JSON.stringify({
          keys: [
            {
              ...publicKey,
              alg: signingAlgorithm,
              kid: signingKeyId,
              use: "sig",
            },
          ],
        }),
      );
  });
  server.listen(0, host);
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not start the controlled OAuth test issuer");
  }

  testAuth0Issuer = `http://${host}:${address.port}/`;
  return { stop: () => stopServer(server) };
}

async function stopServer(server: Server) {
  server.close();
  await once(server, "close");
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

async function startApplication({
  omittedOAuthVariable,
}: {
  omittedOAuthVariable?: "AUTH0_AUDIENCE" | "AUTH0_ISSUER";
} = {}): Promise<StartedApplication> {
  const port = await findAvailablePort();
  const origin = `http://${host}:${port}`;
  const processLogs: string[] = [];
  const nextBin = new URL("../node_modules/next/dist/bin/next", import.meta.url);
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    AUTH0_AUDIENCE: testAudience,
    AUTH0_ISSUER: testAuth0Issuer,
    NEXT_TELEMETRY_DISABLED: "1",
  };
  if (omittedOAuthVariable) {
    delete environment[omittedOAuthVariable];
  }

  const application = spawn(
    process.execPath,
    [nextBin.pathname, "dev", "--hostname", host, "--port", String(port)],
    {
      cwd: new URL("../", import.meta.url),
      env: environment,
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

async function issueAccessToken({
  audience = testAudience,
  expirationTime = "5m",
  issuer = testAuth0Issuer,
  privateKey = signingKey,
  scope = foundationScope,
  subject = testOwnerSubject,
}: {
  audience?: string;
  expirationTime?: string | number | Date | null;
  issuer?: string;
  privateKey?: CryptoKey;
  scope?: string;
  subject?: string | null;
} = {}) {
  let token = new SignJWT({ scope })
    .setProtectedHeader({ alg: signingAlgorithm, kid: signingKeyId })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt();

  if (subject !== null) {
    token = token.setSubject(subject);
  }

  if (expirationTime !== null) {
    token = token.setExpirationTime(expirationTime);
  }

  return token.sign(privateKey);
}

async function connectClient(
  origin: string,
  accessToken: string,
  observeResponse?: (response: Response) => void,
) {
  const client = new Client({
    name: "plutus-integration-test",
    version: "1.0.0",
  });
  const transport = new StreamableHTTPClientTransport(
    new URL("/mcp", origin),
    {
      authProvider: { token: async () => accessToken },
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        observeResponse?.(response);
        return response;
      },
    },
  );
  await client.connect(transport);
  return client;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

let application: StartedApplication | undefined;
let authorizationServer: StartedAuthorizationServer | undefined;
let client: Client | undefined;

function getApplicationOrigin() {
  if (!application) {
    throw new Error("The test application has not started");
  }

  return application.origin;
}

before(async () => {
  const keyPair = await generateKeyPair(signingAlgorithm);
  signingKey = keyPair.privateKey;
  authorizationServer = await startAuthorizationServer(
    await exportJWK(keyPair.publicKey),
  );
  application = await startApplication();
  client = await connectClient(application.origin, await issueAccessToken());
});

after(async () => {
  await client?.close();
  await application?.stop();
  await authorizationServer?.stop();
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

test("an unauthenticated client receives the OAuth challenge and protected resource metadata", async () => {
  assert.ok(application);

  const response = await fetch(new URL("/mcp", application.origin));
  assert.equal(response.status, 401);
  assert.equal(
    response.headers.get("www-authenticate"),
    `Bearer error="invalid_token", error_description="No authorization provided", scope="${foundationScope}", resource_metadata="${application.origin}/.well-known/oauth-protected-resource/mcp"`,
  );

  const metadataResponse = await fetch(
    new URL("/.well-known/oauth-protected-resource/mcp", application.origin),
  );
  assert.equal(metadataResponse.status, 200);
  assert.deepEqual(await metadataResponse.json(), {
    resource: `${application.origin}/mcp`,
    authorization_servers: [testAuth0Issuer],
  });
});

test("a client with a token signed by an untrusted key is rejected", async () => {
  const origin = getApplicationOrigin();
  const untrustedKeyPair = await generateKeyPair(signingAlgorithm);
  const accessToken = await issueAccessToken({
    privateKey: untrustedKeyPair.privateKey,
  });

  await assert.rejects(() => connectClient(origin, accessToken));
});

test("a client with a token from another issuer is rejected", async () => {
  const origin = getApplicationOrigin();
  const accessToken = await issueAccessToken({
    issuer: "https://another-issuer.example/",
  });

  await assert.rejects(() => connectClient(origin, accessToken));
});

test("a client with a token for another audience is rejected", async () => {
  const origin = getApplicationOrigin();
  const accessToken = await issueAccessToken({
    audience: "https://another-resource.example/mcp",
  });

  await assert.rejects(() => connectClient(origin, accessToken));
});

test("a client with an expired token is rejected", async () => {
  const origin = getApplicationOrigin();
  const accessToken = await issueAccessToken({
    expirationTime: Math.floor(Date.now() / 1000) - 60,
  });

  await assert.rejects(() => connectClient(origin, accessToken));
});

test("a client with a token missing its expiry is rejected", async () => {
  const origin = getApplicationOrigin();
  const accessToken = await issueAccessToken({ expirationTime: null });

  await assert.rejects(() => connectClient(origin, accessToken));
});

test("a client with a token missing its subject is rejected", async () => {
  const origin = getApplicationOrigin();
  const accessToken = await issueAccessToken({ subject: null });

  await assert.rejects(() => connectClient(origin, accessToken));
});

test("a client with the required scope is accepted regardless of subject", async () => {
  const origin = getApplicationOrigin();
  const accessToken = await issueAccessToken({
    subject: "google-oauth2|another-user",
  });
  const anotherSubjectClient = await connectClient(origin, accessToken);

  try {
    const { tools } = await anotherSubjectClient.listTools();
    assert.deepEqual(
      tools.map(({ name }) => name),
      ["echo"],
    );
  } finally {
    await anotherSubjectClient.close();
  }
});

test("a client with a token missing the foundation scope is rejected", async () => {
  const origin = getApplicationOrigin();
  const accessToken = await issueAccessToken({ scope: "openid profile" });
  const responseStatuses: number[] = [];

  await assert.rejects(() =>
    connectClient(origin, accessToken, ({ status }) => {
      responseStatuses.push(status);
    }),
  );
  assert.ok(responseStatuses.includes(403));
});

for (const omittedOAuthVariable of [
  "AUTH0_AUDIENCE",
  "AUTH0_ISSUER",
] as const) {
  test(`the MCP boundary fails closed when ${omittedOAuthVariable} is absent`, async () => {
    const accessToken = await issueAccessToken();
    const misconfiguredApplication = await startApplication({
      omittedOAuthVariable,
    });

    try {
      await assert.rejects(() =>
        connectClient(misconfiguredApplication.origin, accessToken),
      );
    } finally {
      await misconfiguredApplication.stop();
    }
  });
}

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
