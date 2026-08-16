import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from "mcp-handler";

import { getOAuthConfig } from "@/src/auth/config";

export function GET(request: Request) {
  const { issuer } = getOAuthConfig();
  return protectedResourceHandler({ authServerUrls: [issuer] })(request);
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
