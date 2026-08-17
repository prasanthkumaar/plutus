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

Create a Clerk application and store its development keys in the 1Password
fields referenced by the repository-wide `.env.schema`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

The schema contains only 1Password secret-reference URIs and is safe to commit.
Do not replace those references with either value. The publishable key
identifies the Clerk frontend API used by the OAuth metadata helpers. The secret
key remains server-only and is used by Clerk's Next.js authentication
middleware.

Protected-resource metadata advertises `openid`, `profile`, `email` and
`offline_access`. Clerk uses `offline_access` to grant refresh-token access.

For this private foundation, configure the Clerk application outside the
repository with Invite-only access, invite only the owner, enable only Google
sign-in and switch off **Generate access tokens as JWTs**. Plutus intentionally
does not repeat that membership boundary with an email, user ID or custom
scope check.

## Run locally

Start the MCP server:

```sh
pnpm dev:1password
```

`op run` resolves the root `.env.schema` and provides the two Clerk values only
to the development process. Plain `pnpm dev` remains available when the
variables are already present in the shell environment.

The MCP endpoint is available at `http://127.0.0.1:3000/mcp`.
OAuth discovery is public at:

- `/.well-known/oauth-protected-resource/mcp`
- `/.well-known/oauth-authorization-server`

## Clerk guide alignment

The authentication callback, metadata helpers, CORS handlers and Next.js 15
middleware follow Clerk's [Next.js MCP guide](https://clerk.com/docs/nextjs/guides/ai/mcp/build-mcp-server).
Plutus keeps three deliberate differences from the complete example:

- The fixed `/mcp` route replaces the optional `[transport]` segment because
  Plutus supports only Streamable HTTP.
- The route exports only `POST`; Clerk documents `GET` as necessary only when
  supporting the deprecated SSE transport.
- The provider-neutral echo server stays in its own factory and does not use
  `clerkClient()` because it does not read Clerk user data.

## Verify

With the development server running, complete Clerk OAuth with an MCP client
and make its access token available to the verification process as
`PLUTUS_MCP_ACCESS_TOKEN`. Use a secret manager or shell workflow that does not
record the value in the repository or command history. Then use the official
MCP TypeScript SDK v2 client to discover the tool and invoke `echo`:

```sh
pnpm verify:mcp -- http://127.0.0.1:3000
```

The verification script sends the token as a bearer token and redacts it from
reported errors.

Run the automated HTTP integration test and supporting checks with:

```sh
pnpm test
pnpm type-check
pnpm build
```
