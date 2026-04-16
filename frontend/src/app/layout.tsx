import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoneyPet",
  description: "AI agent with a real Locus wallet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="dapp-detection" content="false" />
        {/* Suppress MetaMask auto-connect errors — we use Locus, not MetaMask */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('unhandledrejection', function(e) {
            if (e.reason && e.reason.message && e.reason.message.includes('MetaMask')) {
              e.preventDefault();
            }
          });
          window.addEventListener('error', function(e) {
            if (e.message && e.message.includes('MetaMask')) {
              e.preventDefault();
              return true;
            }
          });
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
