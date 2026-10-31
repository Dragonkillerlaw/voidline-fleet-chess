import type { Metadata } from "next";
import "./globals.css";
import "./player.css";
import {PreferencesProvider} from './preferences';

export const metadata: Metadata = {
  title: "VOIDLINE · Fleet Chess",
  description: "Learn 3D space tactics through six ship-skill lessons, four fleet combinations, four endgame puzzles and three opening plans. Command two ships per turn against AI or friends online.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><PreferencesProvider>{children}</PreferencesProvider></body>
    </html>
  );
}
