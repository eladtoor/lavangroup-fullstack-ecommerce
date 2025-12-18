import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import AccessibilityWidget from "@/components/AccessibilityWidget";
import GTranslateScript from "@/components/GTranslateScript";
import GoogleTagManager from "@/components/GoogleTagManager";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

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
