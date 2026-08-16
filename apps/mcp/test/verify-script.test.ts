import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

const controlledAccessToken = "controlled-verification-token";
const tsxBin = new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url);
const verifyScript = new URL("../scripts/verify.ts", import.meta.url);

function runVerification(origin: string, trustedOrigin?: string) {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    PLUTUS_MCP_ACCESS_TOKEN: controlledAccessToken,
  };

  if (trustedOrigin) {
    environment.PLUTUS_MCP_TRUSTED_ORIGIN = trustedOrigin;
  } else {
    delete environment.PLUTUS_MCP_TRUSTED_ORIGIN;
  }

  return spawnSync(
    process.execPath,
    [tsxBin.pathname, verifyScript.pathname, origin],
    {
      encoding: "utf8",
      env: environment,
      timeout: 5_000,
    },
  );
}

async function stopProcess(process: ChildProcess) {
  if (process.exitCode !== null) {
    return;
  }

  process.kill("SIGTERM");
  await once(process, "exit");
}

async function startTokenReflectingServer() {
  const source = `
    const { createServer } = require("node:http");
    const server = createServer((request, response) => {
      response.writeHead(500, { "content-type": "text/plain" });
      response.end(request.headers.authorization ?? "missing authorization");
    });
    server.listen(0, "127.0.0.1", () => {
      process.stdout.write(String(server.address().port) + "\\n");
    });
    process.on("SIGTERM", () => server.close());
  `;
  const server = spawn(process.execPath, ["--eval", source], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  assert.ok(server.stdout);

  const [chunk] = await once(server.stdout, "data");
  const port = Number.parseInt(chunk.toString(), 10);
  assert.ok(Number.isInteger(port));

  return {
    origin: `http://127.0.0.1:${port}`,
    stop: () => stopProcess(server),
  };
}

test("remote verification rejects HTTP before sending a token", () => {
  const result = runVerification(
    "http://remote.example/mcp",
    "http://remote.example",
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Remote MCP verification requires HTTPS/);
  assert.doesNotMatch(result.stderr, new RegExp(controlledAccessToken));
});

test("remote verification requires an exact trusted-origin opt-in", () => {
  for (const trustedOrigin of [undefined, "https://other.example"]) {
    const result = runVerification(
      "https://remote.example",
      trustedOrigin,
    );

    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /PLUTUS_MCP_TRUSTED_ORIGIN must exactly match https:\/\/remote\.example/,
    );
    assert.doesNotMatch(result.stderr, new RegExp(controlledAccessToken));
  }
});

test("verification errors never print the access token", async () => {
  const server = await startTokenReflectingServer();

  try {
    const result = runVerification(server.origin);

    assert.equal(result.status, 1);
    assert.doesNotMatch(result.stderr, new RegExp(controlledAccessToken));
  } finally {
    await server.stop();
  }
});
