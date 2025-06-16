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
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-xl rounded-full bg-white/70 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-gray-200 flex items-center justify-center px-8 py-3 ring-1 ring-white/30 transition-all duration-200 hover:scale-105 hover:opacity-95">
          {/* Left links */}
          <div className="flex items-center gap-6 absolute left-8 top-1/2 -translate-y-1/2">
            <a href="/#how-it-works" className="text-gray-700 hover:text-blue-600 font-medium">How it Works</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Pricing</a>
          </div>
          {/* Center logo */}
          <div className="flex-1 flex justify-center">
            <a href="/" className="font-extrabold text-2xl md:text-3xl tracking-tight text-blue-600">eclero</a>
          </div>
          {/* Right links */}
          <div className="flex items-center gap-6 absolute right-8 top-1/2 -translate-y-1/2">
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">About</a>
            <a href="/auth/login" className="ml-2 py-2 px-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">Log In</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
