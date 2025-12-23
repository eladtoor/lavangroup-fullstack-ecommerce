import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Load Font Awesome CSS FIRST
import "@fortawesome/fontawesome-free/css/all.min.css";
// Load globals.css AFTER Font Awesome so our font-display overrides work
import "./globals.css";
import dynamic from "next/dynamic";
import GoogleTagManager from "@/components/GoogleTagManager";
import GTranslateScript from "@/components/GTranslateScript";
import NavBar from "@/components/NavBar";
// Footer is now dynamically imported below

// Code split non-critical components to reduce initial bundle size (saves ~242 KiB)
const FloatingWhatsAppButton = dynamic(() => import("@/components/FloatingWhatsAppButton"), {
  ssr: false,
  loading: () => null, // Don't show loading state
});
const AccessibilityWidget = dynamic(() => import("@/components/AccessibilityWidget"), {
  ssr: false,
  loading: () => null, // Don't show loading state
});
// Code split Footer to reduce initial bundle
const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: true, // Footer is important for SEO, keep SSR
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,  // Allow zoom for accessibility (up to 5x)
  userScalable: true,  // Enable user zoom (accessibility requirement)
  themeColor: "#ef4444",
  colorScheme: "light",
  viewportFit: "cover",  // Support iPhone notch/Dynamic Island
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://lavangroup.co.il"),
  title: {
    template: "%s | Lavangroup",
    default: "Lavangroup - חומרי בניין ושיפוצים",
  },
  description: "חנות מקוונת לחומרי בניין, גבס, אביזרים ועוד. משלוחים מהירים לכל הארץ",
  keywords: ["חומרי בניין", "גבס", "שיפוצים", "אביזרים", "לבן גרופ"],
  authors: [{ name: "Lavangroup" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Lavangroup - חומרי בניין ושיפוצים",
    description: "חנות מקוונת לחומרי בניין, גבס, אביזרים ועוד",
    url: "/",
    siteName: "Lavangroup",
    locale: "he_IL",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Lavangroup Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lavangroup - חומרי בניין ושיפוצים",
    description: "חנות מקוונת לחומרי בניין, גבס, אביזרים ועוד. משלוחים מהירים לכל הארץ",
    images: ["/logo.png"],
    creator: "@lavangroup",
    site: "@lavangroup",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={inter.variable}>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <GoogleTagManager />
        <Providers>
          <GTranslateScript />
          <NavBar />
          <main className="flex-grow">{children}</main>
          {modal}
          <Footer />
          <FloatingWhatsAppButton />
          <AccessibilityWidget />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={true}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Providers>
      </body>
    </html>
  );
}
