import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BioNova — Panel",
  description: "Panel de administracion para BioNova",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geist.className} text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
