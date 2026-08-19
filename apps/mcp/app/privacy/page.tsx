export default function PrivacyPage() {
  return (
    <main>
      <h1>Privacy</h1>
      <p>Last updated 19 August 2026.</p>
      <p>
        Google sign-in provides the owner&apos;s name, email address and basic
        profile information to Clerk. <code>sh</code> uses this information
        only to authenticate the owner, protect access and diagnose
        authentication failures. It does not request access to Gmail, Google
        Drive or other Google services.
      </p>
      <p>
        Clerk processes authentication data and Vercel hosts the service.{" "}
        <code>sh</code> does not sell personal information, use it for
        advertising or share it with unrelated third parties.
      </p>
      <p>
        The owner can revoke an authorised client, remove the Google connection
        or delete the Clerk account.
      </p>
      <p>
        Information received from Google is used in accordance with the Google
        API Services User Data Policy, including its Limited Use requirements.
        Questions or deletion requests can be sent to{" "}
        <a href="mailto:prasanthkumaar@gmail.com">prasanthkumaar@gmail.com</a>.
      </p>
    </main>
  );
}
