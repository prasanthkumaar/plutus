# Plutus

Plutus is a pnpm workspace for finance applications. Its first application is
a small, server-only Model Context Protocol (MCP) server that future finance
tools can build on.

## Workspace

- `apps/mcp` contains the stateless Next.js MCP server.
- `/mcp` exposes one read-only, idempotent `echo` tool.
- There is no browser interface, authentication, deployment configuration or
  finance integration in this foundation.

## Requirements

- Node.js 20 or newer
- pnpm 10.34.5

Install the workspace from the repository root:

```sh
pnpm install
```

## Run locally

Start the MCP server:

```sh
pnpm dev
```

The MCP endpoint is available at `http://localhost:3000/mcp`.

## Verify

The integration test starts the application and uses the official MCP
TypeScript SDK v2 client against the `/mcp` HTTP endpoint:

```sh
pnpm test
pnpm type-check
pnpm build
```
