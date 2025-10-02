import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'eclero',
  description: 'Peer-to-peer tutoring platform',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/excalidraw.css" />
      </head>
      <body className="bg-gray-900 overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
