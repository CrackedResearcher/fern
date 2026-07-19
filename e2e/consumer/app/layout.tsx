import type { ReactNode } from "react"

export const metadata = { title: "fern e2e consumer" }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
