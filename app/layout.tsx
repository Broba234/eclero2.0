import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'

const inter = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

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
      <body className={`bg-gray-900 overflow-x-hidden ${inter.className}`}>
        {children}
      </body>
    </html>
  )
}
