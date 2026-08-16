# Plutus

Plutus is a pnpm workspace for finance applications. Its first application is
a small, server-only Model Context Protocol (MCP) server that future finance
tools can build on.

## Workspace

- `apps/mcp` contains the stateless Next.js MCP server.
- `/mcp` exposes one read-only, idempotent `echo` tool.
- Auth0-compatible OAuth protects the MCP endpoint.
- There is no browser interface or finance integration in this foundation.

## Requirements

- Node.js 20 or newer
- pnpm 10.34.5

Install the workspace from the repository root:

```sh
pnpm install
```

## Configure OAuth

Copy `apps/mcp/.env.example` to `apps/mcp/.env.local` and provide:

- `AUTH0_ISSUER`: the exact Auth0 issuer URL, including its trailing slash.
- `AUTH0_AUDIENCE`: the exact Auth0 API identifier expected in access tokens.

These values are read only by the server. The application fails closed when
either value is absent or invalid. The server accepts only RS256 access tokens
signed by the configured issuer, for the configured audience, with an expiry,
a subject and the `access:plutus` scope. It obtains signing keys from the
issuer's `/.well-known/jwks.json` endpoint.

For the Auth0 API, [enable RBAC](https://auth0.com/docs/manage-users/access-control/configure-core-rbac/enable-role-based-access-control-for-apis),
define the `access:plutus` permission and assign it directly to the owner's
Google-backed Auth0 user. Clients must request `access:plutus`; Auth0 includes
it in the token's `scope` only when the user has that permission. The MCP server
uses the scope as the coarse access boundary for the full `/mcp` endpoint. It
requires a `sub` claim for token validity but does not maintain a subject
allow-list.

Auth0 [generally recommends assigning permissions through roles](https://auth0.com/docs/manage-users/access-control/configure-core-rbac/rbac-users/assign-permissions-to-users).
This single-user foundation intentionally assigns the permission directly to
avoid an unnecessary role layer. Revisit that choice if Plutus gains more
users or permission groups.

## Run locally

Start the MCP server, which listens only on `127.0.0.1` by default:

```sh
pnpm dev
```

The MCP endpoint is available at `http://127.0.0.1:3000/mcp`.
Unauthenticated clients discover the configured issuer through
`/.well-known/oauth-protected-resource/mcp`.

## Verify MCP

With the development server running, obtain an access token through the
configured Auth0 OAuth client for the configured audience and `access:plutus`
scope. Expose it to the verification process as `PLUTUS_MCP_ACCESS_TOKEN`
using a secret manager or shell workflow that does not record the value in the
repository or command history. Then use the official MCP TypeScript SDK v2
client to discover and invoke `echo`:

```sh
pnpm verify:mcp -- http://127.0.0.1:3000
```

Loopback verification needs no additional trust setting. For a remote server,
the command accepts only HTTPS and requires an explicit, exact origin match
before it constructs the token-bearing transport:

```sh
PLUTUS_MCP_TRUSTED_ORIGIN=https://plutus.example \
  pnpm verify:mcp -- https://plutus.example
```

### Preview boundary

[RFC 9728 requires](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.3)
protected-resource metadata to identify the exact resource URL the client
requested. A preview deployment therefore advertises its own preview `/mcp`
URL, while this foundation deliberately keeps `AUTH0_AUDIENCE` as the single
canonical production `/mcp` URI. The [MCP authorization specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#resource-parameter-implementation)
requires clients to identify the MCP resource they intend to use by its
canonical URI.

Verify a preview without a bearer token: check its `401` challenge, follow its
`resource_metadata` URL and confirm the metadata `resource` is the preview
`/mcp` URL. Do not start OAuth or run the token-bearing verification command
against a per-deployment preview. Promote the exact verified artefact first,
then perform authenticated verification at the canonical production resource.

The automated integration test uses a controlled local issuer and signed test
tokens. It does not contact or modify a live Auth0 tenant. Run it and the
supporting checks with:

```sh
pnpm test
pnpm type-check
pnpm build
```

Production operation, Auth0 Dashboard gates and the preview-first release
procedure are documented in [the MCP operations runbook](docs/operations/mcp.md).
