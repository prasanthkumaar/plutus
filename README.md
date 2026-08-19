# sh

`sh` is my personal operating system. Like a shell, it is an interface to
everything I build and connect.

Its first application is a small Model Context Protocol (MCP) server that
future personal tools can build on.

## Workspace

- `apps/mcp` contains the stateless `sh-mcp` Next.js server.
- `/mcp` exposes one read-only, idempotent `echo` tool.
- Clerk OAuth protects the MCP endpoint.

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

Do not create or commit a plaintext environment file.

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
