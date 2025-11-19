import type { Metadata } from "next";
import "./globals.css";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "WordCraft",
  description: "Craft with words.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased flex items-center`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
