# Plutus

Plutus is a pnpm workspace for finance applications. Its first application is
a small, server-only Model Context Protocol (MCP) server that future finance
tools can build on.

## Workspace

- `apps/mcp` contains the stateless Next.js MCP server.
- `/mcp` exposes one read-only, idempotent `echo` tool.
- Clerk OAuth protects the MCP endpoint.
- There is no browser interface, deployment configuration or finance
  integration in this foundation.

## Requirements

- Node.js 20 or newer
- pnpm 10.34.5
- 1Password CLI 2.32 or newer, signed in to the account containing the
  development Clerk keys

Install the workspace from the repository root:

```sh
pnpm install
```

## Configure Clerk

The root `.env.schema` maps these development variables to their 1Password
references:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

`apps/mcp/.env.example` documents the same names without values. Do not create
or commit a plaintext environment file.

## Run locally

Start the MCP server:

```sh
pnpm dev:1password
```

`op run` resolves the root `.env.schema` and provides the Clerk values only to
the development process. Plain `pnpm dev` also works when they are already in
the shell environment.

The MCP endpoint is available at `http://localhost:3000/mcp`.
OAuth discovery is public at:

- `/.well-known/oauth-protected-resource/mcp`
- `/.well-known/oauth-authorization-server`

## Verify

The integration test starts the application and exercises Clerk authentication,
metadata, tool discovery and `echo` through the public HTTP boundary:

```sh
pnpm test
pnpm type-check
pnpm build
```
