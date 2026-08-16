# MCP operations

This runbook covers the private Plutus MCP deployment. It deliberately keeps
secret values out of the repository, terminal output and deployment records.

## Target resources

| Resource | Configuration |
| --- | --- |
| Vercel team | `Pras' projects` |
| Vercel project | `plutus-mcp` |
| Project root | `apps/mcp` |
| Canonical production MCP URI | `https://plutus-mcp.vercel.app/mcp` |
| Auth0 API permission | `access:plutus` |
| Auth0 API policy | RBAC enabled, RS256, 600-second access tokens, offline access enabled and consent required |

The production hostname is not ready for private use. It currently points to
PR #7's unauthenticated deployment at commit `cc65d5a`. Do not send production
data to it or attempt OAuth there. It becomes the private MCP resource only
after the owner gates below pass and the exact secured preview artefact is
promoted without rebuilding.

Vercel stores `AUTH0_ISSUER` and `AUTH0_AUDIENCE` as sensitive values for the
Preview and Production environments. Do not retrieve or print their values.
Environment changes apply only to deployments created after the change.

## Delivery status

PR #9 delivers only the operations runbook and protected preview slice. The
Vercel project, canonical Auth0 API, coarse `access:plutus` boundary and two
runtime environment keys are configured. Preview verification is deliberately
unauthenticated.

Issue #6 must remain open. Google-only login, client registration, the owner's
direct permission assignment, real Codex OAuth, permission denial, access-token
refresh, grant and refresh-family revocation, Auth0 log evidence, Fluid Compute
confirmation, exact-artefact production promotion and production verification
all remain owner-gated.

## Auth0 Dashboard release gates

An owner must complete and confirm these settings in the Auth0 Dashboard
before a production release:

1. [Configure the Google social connection](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/google)
   with owner-managed Google keys, test it with **Try Connection**, promote it
   to a domain-level connection and expose no other login connection to
   third-party clients. Enter Google credentials only in the Dashboard, never
   in agent output.
2. In **Settings > Advanced**, enable both
   [Resource Parameter Compatibility Profile](https://auth0.com/ai/docs/mcp/guides/resource-param-compatibility-profile)
   and
   [**Include Issuer in Authorization Responses**](https://auth0.com/docs/get-started/applications/configure-fapi-compliance/configure-auth0-to-pass-openid-fapi-certification-tests).
   The first maps the MCP `resource` parameter to the API audience; the second
   adds the RFC 9207 issuer parameter used for authorization-server mix-up
   defence.
3. Assign `access:plutus` directly to the owner's Google-backed Auth0 user.
   Do not add an application-side subject allow-list or per-tool permissions.
4. Select and configure exactly one registration path for the installed Codex
   build:

   - For a stable Codex metadata URL, enable
     [**Client ID Metadata Document Registration**](https://auth0.com/docs/get-started/auth0-overview/create-applications/register-applications-with-cimd),
     import that exact HTTPS CIMD and configure its user-delegated API grant
     for only `access:plutus`.
   - Otherwise, configure the API's default third-party user permission as only
     `access:plutus`, enable
     [**Dynamic Client Registration**](https://auth0.com/docs/get-started/applications/dynamic-client-registration),
     confirm its security mode is **strict**, register Codex, then disable open
     DCR after onboarding unless another client must be added.

   Both paths create strict third-party clients. Keep consent enabled and make
   only the domain-level Google connection available.
5. Confirm the selected client is OIDC-conformant, uses Authorization Code with
   PKCE and enables both the Authorization Code and Refresh Token grant types.
   Keep **Allow Offline Access** enabled on the API and require the client to
   request `offline_access` as well as `access:plutus`.
6. [Configure rotating refresh tokens](https://auth0.com/docs/secure/tokens/refresh-tokens/configure-refresh-token-rotation)
   [with expiration](https://auth0.com/docs/secure/tokens/refresh-tokens/configure-refresh-token-expiration),
   a maximum lifetime of 30 days, an idle lifetime of 7 days and a short
   rotation overlap period. Keep automatic reuse detection enabled. Reuse of an
   invalidated token must revoke its refresh-token family and grant, requiring
   fresh authentication.
7. Confirm the tenant's
   [refresh-token revocation semantics](https://auth0.com/docs/secure/tokens/refresh-tokens/revoke-refresh-tokens).
   Dashboard revocation under the user's **Authorized Applications**
   invalidates refresh tokens for that application. It does not invalidate an
   already issued access token, which can remain valid for its 600-second
   lifetime.

Keep Auth0 administrative tooling logged out or restricted to read-only tools
after any change. The deployment does not require standing Auth0 Management API
write access.

## Vercel pre-production gate

The current
[Vercel MCP template](https://github.com/vercel-labs/mcp-for-next.js)
recommends Fluid Compute for efficient execution. Before creating the candidate
for production promotion, confirm **Fluid Compute** is enabled under the
`plutus-mcp` project's Function settings, save the setting and create a new
preview so the candidate includes it. Do not assume the project default is
active.

## Preview release

Run the repository checks before deploying:

```sh
pnpm test
pnpm type-check
pnpm build
```

Push the issue branch to create a Vercel preview. Verify the exact deployment
artefact without a bearer token:

1. Confirm the deployment is Ready and inspect its build and runtime errors.
2. Request `/mcp` without credentials. Expect `401` and a `WWW-Authenticate`
   challenge advertising `access:plutus` and the protected-resource metadata
   URL.
3. Request `/.well-known/oauth-protected-resource/mcp`. Expect the preview
   `/mcp` URI and one HTTPS authorisation server. `mcp-handler` 2.1.1 does not
   add the optional `scopes_supported` field; the challenge carries the
   required permission instead.
4. Confirm the deployment is a preview for the expected branch and commit.

Do not register the preview in Codex, start OAuth or send it a bearer token.
Plutus has one canonical production Auth0 API and no preview audience, so all
authenticated checks belong at the canonical production resource after exact
artefact promotion.

Do not record bearer tokens, refresh tokens, Google credentials or Auth0
administrative tokens as verification evidence.

## Production promotion and verification

Production promotion is a separate owner approval gate. After every Auth0 and
Vercel gate above passes, name the `plutus-mcp` project and exact preview
deployment being promoted. Promote that verified artefact without rebuilding:

```sh
vercel promote https://<exact-verified-preview-host>
```

Only after promotion, register the canonical production resource and complete
OAuth without copying tokens into commands, logs or chat:

```sh
codex mcp add plutus --url https://plutus-mcp.vercel.app/mcp
codex mcp login plutus --scopes access:plutus,offline_access
```

Complete all remaining issue #6 checks at that canonical URI:

1. Repeat the unauthenticated challenge, protected-resource metadata and
   runtime-error checks.
2. Confirm Google is the only login option, then complete owner OAuth, list
   tools and invoke `echo`.
3. Confirm a valid token for a user without the direct `access:plutus`
   assignment receives `403`.
4. Wait for access-token expiry and invoke `echo` to prove refresh succeeds
   without exposing either token.
5. Keep Codex logged in, revoke the user's application grant or refresh-token
   family, wait for the current access token's 600-second maximum lifetime and
   invoke `echo` again. Confirm refresh fails and Codex requires a new login,
   then run `codex mcp logout plutus`.
6. Inspect Auth0 logs for the successful login and deliberate denials, and
   inspect Vercel production runtime errors. Record no credentials or token
   values as evidence.

Keep issue #6 open until this whole production sequence is complete.

## Access revocation

To stop new access-token issuance and complete lockout within 600 seconds,
remove `access:plutus` from the owner's Auth0 user, revoke the Codex application
grant and revoke its refresh-token family. Keep Codex logged in until the
existing access token expires, invoke `echo` and confirm the refresh attempt
fails. Then run `codex mcp logout plutus` locally. Restore access by reassigning
the permission and completing a fresh production login.
