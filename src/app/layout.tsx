import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import "./globals.css"; // TypeScript should be fine with this after the restart

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FitIn - מערכת שיבוץ גננות",
  description: "מערכת ניהול ושיבוץ גננות מחליפות",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${assistant.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}