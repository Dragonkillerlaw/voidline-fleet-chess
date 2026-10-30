import type { Metadata } from "next";
import "./globals.css";
import "./player.css";
import {PreferencesProvider} from './preferences';

export const metadata: Metadata = {
  title: "VOIDLINE · 深空舰队棋",
  description: "从三艘小艇开始学习太空战术：四课基础训练、三套开局计划、四道残局挑战。每回合指挥两艘战舰，在三维战区演练与对战。",
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
    <html lang="zh-CN">
      <body className="antialiased"><PreferencesProvider>{children}</PreferencesProvider></body>
    </html>
  );
}
