import type React from "react"
import "./globals.css"

export const metadata = {
  title: "NKEBI UNIV - Université",
  description: "Application universitaire NKEBI UNIV",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
