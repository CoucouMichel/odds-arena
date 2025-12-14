import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- C'EST CETTE LIGNE QUI EST CRUCIALE

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Odds Arena",
  description: "Jeu de paris sportifs entre amis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}