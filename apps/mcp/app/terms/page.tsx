import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using sh.",
};

export default function TermsPage() {
  return (
    <main className="legal">
      <h1>Terms</h1>
      <p className="updated">Last updated 19 August 2026</p>

      <h2>Private service</h2>
      <p>
        <code>sh</code> is private personal software. Access is limited to
        people expressly invited by its owner. No public user account
        registration is offered.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not attempt to access <code>sh</code>, its tools or its data without
        permission. Authorised clients must use the service only for the
        owner&apos;s personal workflows.
      </p>

      <h2>Availability</h2>
      <p>
        The service may change, pause or stop at any time. It is provided as-is
        without guarantees of availability or fitness for a particular purpose.
      </p>

      <h2>Contact</h2>
      <p>
        Questions can be sent to{" "}
        <a href="mailto:prasanthkumaar@gmail.com">
          prasanthkumaar@gmail.com
        </a>
        .
      </p>
    </main>
  );
}
