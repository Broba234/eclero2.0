import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'eclero',
  description: 'Peer-to-peer tutoring platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-900">
        {children}
      </body>
    </html>
  )
}
