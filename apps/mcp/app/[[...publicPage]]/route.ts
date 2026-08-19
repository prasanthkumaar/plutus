const pages: Record<string, { title: string; body: string }> = {
  "/": {
    title: "sh",
    body: `
      <h1>sh</h1>
      <p><code>sh</code> is Pras's personal operating system. Its first service lets approved AI clients connect to personal tools through the Model Context Protocol.</p>
      <p>Google sign-in is used only to authenticate the owner. No access to Gmail, Google Drive or other Google services is requested.</p>
      <nav><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></nav>
    `,
  },
  "/privacy": {
    title: "Privacy",
    body: `
      <h1>Privacy</h1>
      <p>Last updated 19 August 2026.</p>
      <p>Google sign-in provides the owner's name, email address and basic profile information to Clerk. <code>sh</code> uses this information only to authenticate the owner, protect access and diagnose authentication failures. It does not request access to Gmail, Google Drive or other Google services.</p>
      <p>Clerk processes authentication data and Vercel hosts the service. <code>sh</code> does not sell personal information, use it for advertising or share it with unrelated third parties.</p>
      <p>The owner can revoke an authorised client, remove the Google connection or delete the Clerk account.</p>
      <p>Information received from Google is used in accordance with the Google API Services User Data Policy, including its Limited Use requirements. Questions or deletion requests can be sent to <a href="mailto:prasanthkumaar@gmail.com">prasanthkumaar@gmail.com</a>.</p>
    `,
  },
  "/terms": {
    title: "Terms",
    body: `
      <h1>Terms</h1>
      <p>Last updated 19 August 2026.</p>
      <p><code>sh</code> is private personal software. Do not access it, its tools or its data without permission.</p>
      <p>The service may change or stop at any time and is provided as-is. Questions can be sent to <a href="mailto:prasanthkumaar@gmail.com">prasanthkumaar@gmail.com</a>.</p>
    `,
  },
};

export function GET(request: Request) {
  const pathname = new URL(request.url).pathname.replace(/\/$/, "") || "/";
  const page = pages[pathname];

  if (!page) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${page.title}</title></head><body><main>${page.body}</main></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
