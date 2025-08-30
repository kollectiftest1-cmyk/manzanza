import type React from "react"
import "./globals.css"

export const metadata = {
  title: "ISIPA - Université",
  description: "Application universitaire ISIPA",
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
