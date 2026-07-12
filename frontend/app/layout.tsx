import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Vocari - Orientacion Vocacional Inteligente",
    template: "%s | Vocari",
  },
  description:
    "Orientacion vocacional inteligente basada en evidencia. Test RIASEC, datos MINEDUC y rutas hacia IA para estudiantes y profesionales en Chile.",
  keywords: [
    "orientacion vocacional",
    "RIASEC",
    "carreras Chile",
    "reconversion laboral",
    "skill graph",
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
      <body
        className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}