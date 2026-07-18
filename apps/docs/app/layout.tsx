import "./global.css"
import { RootProvider } from "fumadocs-ui/provider/next"
import { Inter } from "next/font/google"
import { Suspense, type ReactNode } from "react"
import { UrlTheme } from "@/components/url-theme"

/**
 * Self-hosted through next/font rather than a <link> to Google. It removes a
 * render-blocking third-party request and generates the size-adjusted fallback
 * that stops the first paint reflowing — the same treatment their docs use.
 */
const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "fern — React UI blocks",
  description:
    "Thoughtfully designed React UI blocks. Low-dependency, copy-paste, yours to edit.",
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    // The font class goes on <body>, not <html>. next-themes rewrites <html>'s
    // class list on mount, and a server-rendered class there does not survive
    // that rewrite — which shows up as a hydration mismatch rather than as a
    // missing font.
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col font-sans`}>
        <RootProvider>
          {/* useSearchParams suspends during prerender. */}
          <Suspense fallback={null}>
            <UrlTheme />
          </Suspense>
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
