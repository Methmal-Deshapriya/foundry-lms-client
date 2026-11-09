import type { Metadata } from "next";
import { ORGANIZATION_JSON_LD, jsonLd } from "@/lib/seo";
import { Geist, Geist_Mono, Inter, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import StoreProvider from "@/store/StoreProvider";
import AuthInitializer from "@/features/auth/components/AuthInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Foundry Academy | Learn AI, Full-Stack, UX/UI, Cybersecurity",
  description:
    "Foundry Academy empowers Sri Lankan students to become industry-ready in AI/ML, Full-Stack Engineering, Cybersecurity, Data Science, and UX/UI through practical bootcamps, real-world projects, and expert mentorship.",

  keywords: [
    "Foundry Academy",
    "Foundry LMS",
    "AI courses Sri Lanka",
    "Machine Learning Bootcamp",
    "Full Stack Engineering Course",
    "Cyber Security Bootcamp",
    "UX UI Design Course Sri Lanka",
    "Data Science for Beginners",
    "IT Courses After A/Ls",
    "Learn AI in Sinhala",
    "Tech Education Sri Lanka",
  ],

  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },

  authors: [{ name: "Foundry Academy" }],

  metadataBase: new URL("https://foundrylms.com"),

  openGraph: {
    title:
      "Foundry Academy | Become Job-Ready in AI, Full-Stack & Cybersecurity",
    description:
      "Join Sri Lanka's most practical tech bootcamps in AI, Machine Learning, Full-Stack Development, Cybersecurity, Data Science, and UI/UX. Learn through recordings, assignments, projects, and expert mentorship — all in Sinhala.",
    url: "https://foundrylms.com",
    siteName: "Foundry Academy",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Foundry Academy Bootcamps",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Foundry Academy | Transform Your Tech Career",
    description:
      "Learn AI, Machine Learning, Full-Stack Development, UX/UI, Cybersecurity & more with Foundry Academy. Designed for beginners aiming for top tech roles.",
    images: ["/og-image.png"],
    creator: "@foundrylms",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable}`}
    >
      <body className="font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ORGANIZATION_JSON_LD)} />
        <StoreProvider>
          <AuthInitializer>{children}</AuthInitializer>
        </StoreProvider>
        <Toaster richColors position="top-right" theme="light" />
      </body>
    </html>
  );
}
