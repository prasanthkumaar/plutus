import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How sh handles personal and Google account data.",
};

export default function PrivacyPage() {
  return (
    <main className="legal">
      <h1>Privacy</h1>
      <p className="updated">Last updated 19 August 2026</p>

      <h2>Overview</h2>
      <p>
        <code>sh</code> is private personal software operated by Pras. Its
        current service is an authenticated Model Context Protocol server for
        the owner&apos;s own use.
      </p>

      <h2>Information used</h2>
      <p>
        Google sign-in provides the owner&apos;s name, email address and basic
        profile information to Clerk. Clerk uses this information to
        authenticate the owner and issue OAuth tokens to approved clients.
      </p>

      <h2>Purpose</h2>
      <p>
        This information is used only to identify the owner, protect access to{" "}
        <code>sh</code> and diagnose authentication failures. <code>sh</code>{" "}
        does not request access to Gmail, Google Drive or other Google services.
      </p>

      <h2>Storage and sharing</h2>
      <p>
        Clerk processes authentication data and Vercel hosts the service.{" "}
        <code>sh</code> does not sell personal information, use it for
        advertising or share it with unrelated third parties. No financial or
        portfolio data is stored by this foundation.
      </p>

      <h2>Control and deletion</h2>
      <p>
        The owner can revoke an authorised client, remove the Google connection
        or delete the Clerk account. Questions or deletion requests can be sent
        to <a href="mailto:prasanthkumaar@gmail.com">prasanthkumaar@gmail.com</a>.
      </p>

      <h2>Google API data</h2>
      <p>
        <code>sh</code> uses information received from Google only for
        authentication and in accordance with the Google API Services User Data
        Policy, including its Limited Use requirements.
      </p>
    </main>
  );
}
