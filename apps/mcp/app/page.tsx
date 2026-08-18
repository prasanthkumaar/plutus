export default function HomePage() {
  return (
    <main>
      <h1>Your interface to everything.</h1>
      <p className="lede">
        <code>sh</code> is Pras&apos;s personal operating system. Like a shell,
        it connects the tools, information and workflows he builds for himself.
      </p>
      <h2>What it does</h2>
      <p>
        The first service is a private Model Context Protocol server. It lets
        approved AI clients connect to personal tools through a secure,
        standards-compatible interface.
      </p>
      <h2>How Google data is used</h2>
      <p>
        Google sign-in is used only to authenticate the owner. <code>sh</code>
        receives the owner&apos;s basic profile and email address through Clerk.
        It does not request access to Gmail, Google Drive or other Google
        services.
      </p>
    </main>
  );
}
