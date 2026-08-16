# MCP operations

This runbook covers the private Plutus MCP deployment. It deliberately keeps
secret values out of the repository, terminal output and deployment records.

## Live resources

| Resource | Configuration |
| --- | --- |
| Vercel team | `Pras' projects` |
| Vercel project | `plutus-mcp` |
| Project root | `apps/mcp` |
| Production MCP URI | `https://plutus-mcp.vercel.app/mcp` |
| Auth0 API permission | `access:plutus` |
| Auth0 API policy | RBAC enabled, RS256, 600-second access tokens, offline access enabled and consent required |

Vercel stores `AUTH0_ISSUER` and `AUTH0_AUDIENCE` as sensitive values for the
Preview and Production environments. Do not retrieve or print their values.
Environment changes apply only to deployments created after the change.

## Auth0 Dashboard release gates

An owner must complete and confirm these settings in the Auth0 Dashboard
before a production release:

1. Configure the Google social connection with owner-managed Google keys, test
   the connection and expose only Google to the Codex OAuth client.
2. Enable the Resource Parameter Compatibility Profile for the tenant.
3. Assign `access:plutus` directly to the owner's Google-backed Auth0 user.
   Do not add an application-side subject allow-list or per-tool permissions.
4. Use one Codex client-registration path verified against the live client:
   Client ID Metadata Document (CIMD) when Codex presents stable client
   metadata, otherwise strict Dynamic Client Registration (DCR). Do not enable
   both paths. If DCR is used, disable open registration after the Codex client
   is registered.
5. Configure that client to use Authorization Code with PKCE and rotating,
   expiring refresh tokens. Use a 30-day maximum lifetime, a 7-day idle
   lifetime, a short overlap period and automatic reuse detection.

Keep Auth0 administrative tooling logged out or restricted to read-only tools
after any change. The deployment does not require standing Auth0 Management API
write access.

## Preview release

Run the repository checks before deploying:

```sh
pnpm test
pnpm type-check
pnpm build
```

Push the issue branch to create a Vercel preview. Verify the exact deployment
artefact before opening it to Codex:

1. Confirm the deployment is Ready and inspect its build and runtime errors.
2. Request `/mcp` without credentials. Expect `401` and a `WWW-Authenticate`
   challenge advertising `access:plutus` and the protected-resource metadata
   URL.
3. Request `/.well-known/oauth-protected-resource/mcp`. Expect the preview
   `/mcp` URI and one HTTPS authorisation server. `mcp-handler` 2.1.1 does not
   add the optional `scopes_supported` field; the challenge carries the
   required permission instead.
4. After the Dashboard gates are complete, register the preview endpoint in
   Codex and complete OAuth without copying tokens into commands or chat:

   ```sh
   codex mcp add plutus-preview --url https://<preview-host>/mcp
   codex mcp login plutus-preview --scopes access:plutus
   ```

5. In Codex, list tools and invoke `echo`. Confirm a user without the assigned
   permission receives `403`, while the owner can invoke the endpoint.
6. Keep Codex logged in, revoke the Auth0 grant and refresh-token family, then
   wait for the existing access token's 600-second maximum lifetime. Invoke
   `echo` so Codex attempts a refresh and confirm that refresh fails. Run
   `codex mcp logout plutus-preview` only after recording that result. Log in
   again only after the permission and grant are restored.

Do not record bearer tokens, refresh tokens, Google credentials or Auth0
administrative tokens as verification evidence.

## Production promotion

Production promotion is a separate approval gate. Promote the exact preview
artefact that passed every check, rather than rebuilding it:

```sh
vercel promote https://<exact-verified-preview-host>
```

Before running the command, name the `plutus-mcp` project and exact deployment
URL being promoted. Afterwards, repeat the unauthenticated challenge, metadata,
real Codex OAuth, `echo`, refresh and revocation checks against
`https://plutus-mcp.vercel.app/mcp`.

## Access revocation

To stop new access-token issuance and complete lockout within 600 seconds,
remove `access:plutus` from the owner's Auth0 user, revoke the Codex application
grant and revoke its refresh-token family. Keep Codex logged in until the
existing access token expires, invoke `echo` and confirm the refresh attempt
fails. Then run `codex mcp logout <registered-server-name>` locally, using the
name registered for the endpoint under test. Restore access by reassigning the
permission and completing a fresh login.
