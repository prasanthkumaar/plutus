import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pras.sh"),
  title: {
    default: "sh",
    template: "%s | sh",
  },
  description: "Pras's personal operating system and interface to everything.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <Link className="wordmark" href="/">
              sh
            </Link>
            <nav aria-label="Legal" className="site-nav">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </nav>
          </header>
          {children}
          <footer className="site-footer">
            <span>sh by Pras</span>
            <span>Private personal software</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
