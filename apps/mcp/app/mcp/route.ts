import { createPlutusMcpHandler } from "@/src/mcp/server";

const handler = createPlutusMcpHandler();

export { handler as GET, handler as POST };
