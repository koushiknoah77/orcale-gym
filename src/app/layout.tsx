import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { OracleNav } from "@/components/oracle-nav";
import { WalletConnectProvider } from "@/components/wallet-connect-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["400","500","600","700"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", weight: ["400","500","600","700"] });

export const metadata: Metadata = {
  title: "Oracle Arena - Gamified Pyth Learning",
  description: "A crypto-game learning platform. Replay real Pyth markets, survive entropy shocks, earn XP, and level up your trading instincts.",
  openGraph: { title: "Oracle Arena", description: "Gamified crypto learning with Pyth Network.", type: "website" },
};
export const viewport: Viewport = { themeColor: "#0A0A1B" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <WalletConnectProvider>
          <div id="bg-wrap" aria-hidden="true" />
          <div className="app-shell">
            <OracleNav />
            <div className="page-body">
              {children}
            </div>
          </div>
        </WalletConnectProvider>
      </body>
    </html>
  );
}
