import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "منظّم — لوحتك الواحدة للوقت والمهام",
  description:
    "منظّم: برنامج إدارة الوقت والمهام اليومية — مهام اليوم والأسبوع والشهر، رؤيتك الشخصية، أهدافك الكبرى، بومودورو، إحصائيات، وأرشفة تلقائية للمنتهية.",
  keywords: ["منظّم", "إدارة الوقت", "المهام", "بومودورو", "Munazzim", "tasks", "productivity"],
  authors: [{ name: "Munazzim" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "منظّم",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "منظّم — Munazzim",
    description: "لوحة واحدة للوقت والمهام: رؤيتك، أهدافك، مهامك، إحصائياتك.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2582b1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@500;600;700;800&family=Tajawal:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --font-cairo: 'Cairo';
            --font-tajawal: 'Tajawal';
          }
        `}</style>
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster position="bottom-center" dir="rtl" richColors />
      </body>
    </html>
  );
}
