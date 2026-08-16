import type { AuthInfo } from "@modelcontextprotocol/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { getOAuthConfig } from "@/src/auth/config";

const remoteKeySets = new Map<
  string,
  ReturnType<typeof createRemoteJWKSet>
>();

function getRemoteKeySet(issuer: string) {
  const jwksUrl = new URL(".well-known/jwks.json", issuer).toString();
  const cachedKeySet = remoteKeySets.get(jwksUrl);
  if (cachedKeySet) {
    return cachedKeySet;
  }

  const keySet = createRemoteJWKSet(new URL(jwksUrl));
  remoteKeySets.set(jwksUrl, keySet);
  return keySet;
}

function parseScopes(scope: unknown) {
  return typeof scope === "string" ? scope.split(" ").filter(Boolean) : [];
}

/** Verifies an Auth0 access token before it reaches the MCP handler. */
export async function verifyAuth0AccessToken(
  _request: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) {
    return undefined;
  }

  const { audience, issuer } = getOAuthConfig();
  const { payload } = await jwtVerify(bearerToken, getRemoteKeySet(issuer), {
    algorithms: ["RS256"],
    audience,
    issuer,
    requiredClaims: ["exp", "sub"],
  });

  return {
    token: bearerToken,
    clientId: payload.sub ?? "unknown-client",
    scopes: parseScopes(payload.scope),
    expiresAt: payload.exp,
  };
}
