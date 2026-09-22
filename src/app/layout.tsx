import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { cookies, headers } from "next/headers";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { Locale } from "@/lib/i18n/translations";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GT CRM | 上奇客戶管理系統",
  description: "Enterprise CRM Platform for GrandTech",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GT CRM",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialLocale: Locale = "zh-TW";
  try {
    const cookieStore = await cookies();
    const savedCookie = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;
    if (savedCookie && ["zh-TW", "en", "ja"].includes(savedCookie)) {
      initialLocale = savedCookie;
    } else {
      const headerList = await headers();
      const acceptLang = headerList.get("accept-language")?.toLowerCase() || "";
      if (acceptLang.startsWith("zh") || acceptLang.includes("zh-tw") || acceptLang.includes("zh-cn") || acceptLang.includes("zh-hk")) {
        initialLocale = "zh-TW";
      } else if (acceptLang.startsWith("ja") || acceptLang.includes("ja")) {
        initialLocale = "ja";
      } else if (acceptLang.startsWith("en") || acceptLang.includes("en")) {
        initialLocale = "en";
      }
    }
  } catch {
    // fallback if headers/cookies unavailable in static generation
  }

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <LanguageProvider initialLocale={initialLocale}>
          {children}
        </LanguageProvider>
        {/* Register Service Worker */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(reg) { console.log('[PWA] SW registered:', reg.scope); })
                  .catch(function(err) { console.log('[PWA] SW failed:', err); });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
