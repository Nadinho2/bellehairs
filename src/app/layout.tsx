import type { Metadata } from "next";
import { Dancing_Script, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

import ExitIntentEmailCapture from "@/components/ExitIntentEmailCapture";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const poppins = Poppins({
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-logo",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BelleHairs Owerri | A Home of Wigs and Hairs",
  description:
    "BelleHairs Owerri is a premium hair brand based in Owerri, Nigeria — shop wigs, bundles, closures, and frontals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${playfairDisplay.variable} ${dancingScript.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex w-full flex-1 flex-col">{children}</main>
        <ExitIntentEmailCapture />
        <a
          href="https://wa.me/2349126914795?text=Hello%20BelleHairs%20Owerri%2C%20I%20want%20to%20place%20an%20order."
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:bg-[#C2177A] focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          <svg
            viewBox="0 0 32 32"
            fill="currentColor"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <path d="M19.11 17.5c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.64.14-.19.28-.73.91-.9 1.1-.16.19-.33.21-.61.07-.28-.14-1.18-.44-2.25-1.39-.83-.74-1.39-1.65-1.56-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.33.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.47-.64-.48l-.55-.01c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.34s1.01 2.71 1.15 2.9c.14.19 1.99 3.04 4.83 4.26.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.66-.68 1.9-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33z" />
            <path d="M15.99 3C8.82 3 3 8.82 3 15.99c0 2.54.73 5.01 2.11 7.13L3.73 29 9.76 27.46a12.93 12.93 0 0 0 6.23 1.58h.01C23.17 29.04 29 23.22 29 16.05 29 8.82 23.17 3 15.99 3zm0 23.71h-.01a10.8 10.8 0 0 1-5.5-1.51l-.4-.24-3.58.91.96-3.49-.26-.43a10.74 10.74 0 0 1-1.65-5.76c0-5.96 4.85-10.8 10.83-10.8 5.97 0 10.82 4.84 10.82 10.8 0 5.96-4.85 10.8-10.81 10.8z" />
          </svg>
        </a>
        <Footer />
      </body>
    </html>
  );
}
