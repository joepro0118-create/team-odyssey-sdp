import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tolong — A little help, closer to home",
  description:
    "A demo neighbourhood marketplace for asking, offering, and lending a hand.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
