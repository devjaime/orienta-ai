import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Vocari - Orientacion Vocacional Inteligente",
    template: "%s | Vocari",
  },
  description:
    "Plataforma de orientacion vocacional con IA para colegios chilenos. Tests RIASEC, sesiones con orientadores, y recomendaciones de carreras basadas en datos.",
  keywords: [
    "orientacion vocacional",
    "RIASEC",
    "carreras Chile",
    "colegios",
    "educacion",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
