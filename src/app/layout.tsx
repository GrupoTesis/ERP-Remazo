import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hospedaje",
  description: "Sistema de gestión del hospedaje",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
