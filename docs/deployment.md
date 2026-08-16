# Clerk and Vercel deployment runbook

This runbook takes the Clerk-protected MCP server from a reviewed commit to a
private Vercel deployment. It deliberately separates Preview from Production:
Clerk permits development keys on `*.vercel.app`, but its Production instance
requires a domain you own and DNS access.

Do not paste secret keys, Google client secrets, OAuth tokens or Vercel
environment values into source control, issue comments, PR comments or command
history.

## Recorded state

The following non-secret facts were checked while preparing this runbook:

| Area | Recorded state |
| --- | --- |
| Clerk | The **Plutus** application exists with ID `app_3I0IdbSIAVL38CeHRH9S1WJ83IF`. Its Development instance is Invite-only, password and email-code sign-in are disabled, and Google is enabled. |
| Vercel | The **plutus-mcp** project exists on the owner's personal team. Its latest foundation Preview was healthy. |
| Production | No Clerk Production instance or production deployment is assumed. An owned domain and DNS access are still required. |

Recheck these settings in each dashboard before continuing. Development and
Production are separate Clerk instances, and users and some settings do not
transfer between them.

## Secrets and owner gates

Only the owner performs actions that reveal or change credentials or live
infrastructure:

- invite the owner in Clerk;
- create the Clerk Production instance;
- add or change Vercel environment variables;
- create the Google OAuth client and copy its secret into Clerk;
- add DNS records or promote a deployment;
- revoke credentials or remove Plutus-specific Auth0 resources.

Plutus needs only these Clerk environment variables:

| Variable | Development and Preview | Production |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Development publishable key | Production publishable key |
| `CLERK_SECRET_KEY` | Development secret key | Production secret key |

The publishable key is public configuration. The secret key must remain
server-only. Vercel environment changes affect only new deployments, so deploy
again after changing a value.

## 1. Finish the Clerk Development instance

In the Clerk Dashboard, select **Plutus** and **Development**.

1. Open **Access mode**, select **Invite-only**, and save. Clerk calls this
   `restricted` through its API.
2. Open **Invitations** and invite only the owner's Google email. Once accepted,
   confirm **Users** contains only the owner and there are no other pending
   invitations.
3. Open **SSO connections**. Keep Google enabled **For all users** and remove or
   disable every other connection. Keep **Block email subaddresses** enabled.
4. Confirm password, email-code and other sign-in strategies remain disabled.
5. Open **OAuth applications > Settings**. Switch off **Generate access tokens
   as JWTs** and save. Clerk will issue opaque access tokens, which trade a
   Clerk network check on every verification for immediate revocation.
6. Keep Clerk's default OAuth consent screen enabled.

Clerk supplies shared Google credentials for Development, so do not create a
custom Google OAuth client for the Preview.

### Register Codex safely

Prefer Client ID Metadata Documents (CIMD) when both conditions are true:

- Clerk support has enabled the beta on this account; and
- the installed Codex build presents a stable HTTPS metadata URL as its client
  ID.

For CIMD, open **OAuth applications > CIMD Clients**, enable **Advertise CIMD
support** and **Only allow pre-registered clients to connect**, then explicitly
allow the Codex client.

If Codex requires Dynamic Client Registration (DCR), enable **Dynamic client
registration** only long enough for Codex to register. This creates a public,
unauthenticated registration endpoint, so confirm the registered Codex client
in Clerk and then disable DCR. Verify the existing client still reconnects.
The Clerk consent screen is mandatory while DCR is enabled.

Some clients omit `scope`. Configure default scopes only if the actual Codex
connection does so. The Clerk Dashboard setting is under **OAuth applications >
Default scopes**. Clerk documents this equivalent CLI call:

```sh
npx clerk@latest api instance/oauth_application_settings -X PATCH -d '{"default_scopes":["openid","profile","email","offline_access"]}'
```

Before using the CLI, confirm it targets the Plutus application and the intended
instance. Use `openid`, `profile`, `email` and `offline_access`. Clerk documents
`offline_access` as the standard scope that grants refresh-token access while
the owner is not actively using Codex. Do not add custom scopes.

## 2. Configure and verify a Vercel Preview

In Vercel, open the owner's **plutus-mcp** project.

1. Under **Settings > Build and Deployment**, confirm **Root Directory** is
   `apps/mcp`.
2. Under **Settings > Environment Variables**, add the Clerk Development values
   for `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to **Preview**
   and **Development** only. Do not assign them to Production.
3. Push the reviewed branch or open its PR to create a new Preview deployment.
4. Record the commit-specific Preview URL and commit SHA. Do not treat a moving
   branch URL as release evidence.

Use a task-specific shell variable for the public checks:

```sh
PLUTUS_ORIGIN="https://<commit-specific-preview>.vercel.app"

curl -i "$PLUTUS_ORIGIN/.well-known/oauth-protected-resource/mcp"
curl -i -X OPTIONS "$PLUTUS_ORIGIN/.well-known/oauth-protected-resource/mcp"
curl -i "$PLUTUS_ORIGIN/.well-known/oauth-authorization-server"
curl -i -X OPTIONS "$PLUTUS_ORIGIN/.well-known/oauth-authorization-server"
curl -i -X POST "$PLUTUS_ORIGIN/mcp"
```

Confirm both metadata routes are public, the `OPTIONS` requests return the
Clerk-provided CORS response, and unauthenticated `POST /mcp` returns `401` with
an OAuth challenge that points to
`/.well-known/oauth-protected-resource/mcp`.

Add the Preview MCP URL to Codex, complete Google sign-in and Clerk consent, then
confirm Codex can list tools and call `echo`. Restart Codex and call `echo` again
without another manual sign-in to prove the refresh grant. Test an uninvited
Google account only far enough to confirm Clerk refuses access; afterwards
confirm no new Clerk user was created. Finally, inspect the deployment's build
and runtime logs and confirm they contain no credentials or tokens.

## 3. Prepare the owned production domain

Stop here until the owner has a domain and can edit its DNS records. Clerk does
not support a Production instance using only a `*.vercel.app` hostname.

1. Add the intended canonical application domain to **Vercel > plutus-mcp >
   Settings > Domains** and apply the DNS records Vercel supplies.
2. In Clerk, select **Development > Create production instance**. Use the owned
   domain. Cloning Development settings is fine, but treat the result as
   untrusted until every setting below is checked.
3. Open Clerk **Domains** and apply every required DNS record. DNS propagation
   can take up to 48 hours.
4. Deploy Clerk's production certificates only after its dashboard shows all
   required domain steps as complete.

Clerk does not copy SSO connections, integrations or paths into Production for
security reasons. Users also do not transfer.

## 4. Configure the Clerk Production instance

Select **Plutus** and **Production** in Clerk, then repeat the Development
boundary independently:

1. Set **Access mode** to **Invite-only**.
2. Invite and admit only the owner's Google email. Confirm there are no other
   users or pending invitations.
3. Disable password, email-code and every non-Google sign-in strategy.
4. Keep **Block email subaddresses** enabled on Google.
5. Under **OAuth applications > Settings**, switch off **Generate access tokens
   as JWTs** and keep the default consent screen enabled.
6. Configure Codex with the same CIMD-preferred, DCR-fallback process used in
   Development. Configure default scopes only if Codex omits them.

Do not assume an OAuth client registered in Development exists in Production.

## 5. Create the production Google OAuth client

Production cannot use Clerk's shared Google credentials.

1. In Clerk Production, open **SSO connections**, add Google **For all users**,
   enable **Enable for sign-up and sign-in** and **Use custom credentials**, and
   copy Clerk's exact **Authorized Redirect URI** to a secure temporary place.
2. In Google Cloud Console, select or create the Plutus project, then open **APIs
   & Services > Credentials > Create Credentials > OAuth client ID**.
3. Select **Web application**.
4. Add the owned application origin, for example `https://mcp.example.com`, as
   an **Authorized JavaScript origin**. Add each real origin variant that will
   be used, but do not add the staged `*.vercel.app` URL.
5. Paste the exact Clerk value into **Authorized redirect URIs**. Do not derive
   or edit the URI.
6. Create the client. Copy its Client ID and Client Secret directly into the
   Clerk Google connection and save. Never put the secret in Vercel or Plutus.
7. Under **APIs & Services > OAuth consent screen**, set the Google app's
   publishing status to **In production**. Complete any Google verification it
   requires.
8. Test Google through Clerk's Production Account Portal before connecting an
   MCP client.

## 6. Stage and promote Production

In **Vercel > plutus-mcp > Settings > Environment Variables**, assign the Clerk
Production values for `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and
`CLERK_SECRET_KEY` to **Production** only. Confirm Development and Preview still
use the Development values.

From the linked Vercel project root, build a Production deployment without
assigning the production domain:

```sh
vercel --prod --skip-domain
```

Record the returned staged deployment URL and the reviewed commit. Check its
build, public metadata, CORS, unauthenticated OAuth challenge and runtime health.
Do not run browser OAuth on the generated staged `*.vercel.app` URL because the
Clerk Production instance and Google client are configured for the owned
domain.

Promote that exact staged Production deployment without rebuilding:

```sh
vercel promote "https://<staged-production-deployment>.vercel.app"
```

On the canonical owned domain, complete Google sign-in and consent from Codex,
list tools and invoke `echo`. Restart Codex and call `echo` again to prove the
client can continue through its stored refresh grant without another manual
sign-in. If it cannot, stop rather than adding a scope outside the reviewed
specification. Then inspect Vercel runtime logs. Record the canonical MCP URL,
deployment URL, commit SHA and pass/fail result without recording credentials.

Before Production, recheck Clerk's current pricing. OAuth access tokens are
machine tokens and Clerk currently says their use is free during the public
beta but will be priced after general availability.

## 7. Leak recovery

### Leaked MCP OAuth token

1. Disable DCR or unknown CIMD clients immediately so no new client can register.
2. Disconnect the affected MCP entry in Codex.
3. Use Clerk's documented `oauthApplications.revokeToken()` operation from a
   trusted server environment, passing the affected registered OAuth
   application ID and either its opaque access token or refresh token. Clerk
   revokes both tokens for that grant.
4. Confirm the old token now receives `401` from `/mcp`.
5. Reconnect Codex, review the consent screen, and confirm a new authorisation is
   required before `echo` works again.

Do not paste either token or the Clerk Secret Key into a ticket, PR, chat or
shell history. If the affected token is unavailable, stop and choose a broader
Clerk client or account recovery action in the Dashboard rather than guessing.

### Leaked `CLERK_SECRET_KEY`

1. Add a new named Secret Key in the affected Clerk instance.
2. Replace `CLERK_SECRET_KEY` in the matching Vercel environment.
3. Redeploy and verify Clerk-backed requests use the new key.
4. Only then delete the old key in Clerk.

Development and Production keys are independent. Rotate only the affected
instance unless evidence shows both were exposed. A leaked publishable key does
not require rotation because it is public configuration.

## 8. Retire Plutus from Auth0

Do this only after the authenticated Clerk Production checks pass.

1. Inventory Auth0 resources and record evidence for each resource that names or
   otherwise uniquely identifies it as Plutus-owned.
2. Remove only positively identified Plutus clients, APIs or other
   Plutus-specific resources.
3. Confirm the Auth0 tenant, owner user, shared Google connection and all
   unrelated clients remain.
4. Re-run the canonical Clerk `/mcp` connection and `echo` check after cleanup.

If ownership is ambiguous, preserve the Auth0 resource and investigate. Never
delete the tenant as part of this runbook.

## Primary sources

- [Clerk Next.js MCP server guide](https://clerk.com/docs/nextjs/guides/ai/mcp/build-mcp-server)
- [Clerk OAuth behaviour and client registration](https://clerk.com/docs/guides/configure/auth-strategies/oauth/how-clerk-implements-oauth)
- [Clerk access modes](https://clerk.com/docs/guides/secure/restricting-access)
- [Clerk Google connection](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google)
- [Clerk production deployment](https://clerk.com/docs/guides/development/deployment/production)
- [Clerk on Vercel](https://clerk.com/docs/guides/development/deployment/vercel)
- [Clerk OAuth token revocation](https://clerk.com/docs/reference/backend/oauth-applications/revoke-token)
- [Clerk Secret Key rotation](https://clerk.com/docs/guides/secure/rotate-api-keys)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel staged Production deployments](https://vercel.com/docs/cli/deploying-from-cli#deploying-a-staged-production-build)
- [Vercel deployment promotion](https://vercel.com/docs/deployments/promoting-a-deployment)
