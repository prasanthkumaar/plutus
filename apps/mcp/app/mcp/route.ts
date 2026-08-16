import { createMcpHandler } from "mcp-handler";

import { configureMcpServer } from "@/src/server";

const handler = createMcpHandler(configureMcpServer, {
  serverInfo: {
    name: "plutus",
    version: "0.1.0",
  },
});

export { handler as GET, handler as POST };
