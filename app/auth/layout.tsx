"use client";
import { useState } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      {/* Navbar from the landing page */}
      <nav className="fixed top-2 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-lg rounded-full bg-white/70 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-gray-200 flex items-center justify-center px-4 py-2 sm:px-6 ring-1 ring-white/30 transition-all duration-200 hover:scale-105 hover:opacity-95">
        {/* Left links */}
        <div className="hidden sm:flex items-center gap-4 absolute left-8 top-1/2 -translate-y-1/2">
          <a href="/#how-it-works" className="text-gray-700 hover:text-blue-600 font-medium">How it Works</a>
          <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Pricing</a>
        </div>
        {/* Center logo */}
        <div className="flex-1 flex justify-center">
          <a href="/" className="font-extrabold text-xl md:text-2xl tracking-tight text-blue-600">eclero</a>
        </div>
        {/* Right links */}
        <div className="hidden sm:flex items-center gap-4 absolute right-8 top-1/2 -translate-y-1/2">
          <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">About</a>
          <a href="/auth/login" className="ml-2 py-1.5 px-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">Log In</a>
        </div>
        {/* Mobile: Hamburger */}
        <div className="sm:hidden absolute right-3 top-1/2 -translate-y-1/2">
          <button
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
            className="inline-flex flex-col items-center justify-center w-9 h-9 rounded-full bg-white/80 border border-white/40 shadow hover:bg-white"
          >
            <span className="block w-5 h-0.5 bg-gray-800" />
            <span className="block w-5 h-0.5 bg-gray-800 mt-1.5" />
            <span className="block w-5 h-0.5 bg-gray-800 mt-1.5" />
          </button>
        </div>
      </nav>
      {/* Mobile dropdown */}
      {menuOpen ? (
        <div className="sm:hidden fixed top-[56px] left-0 right-0 z-40 px-4">
          <div className="mx-auto w-[95vw] max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex flex-col p-2">
              <a onClick={() => setMenuOpen(false)} href="/#how-it-works" className="px-3 py-3 rounded-lg text-gray-800 hover:bg-gray-50">How it Works</a>
              <a onClick={() => setMenuOpen(false)} href="#" className="px-3 py-3 rounded-lg text-gray-800 hover:bg-gray-50">Pricing</a>
              <a onClick={() => setMenuOpen(false)} href="#" className="px-3 py-3 rounded-lg text-gray-800 hover:bg-gray-50">About</a>
              <a onClick={() => setMenuOpen(false)} href="/auth/login" className="mt-1 px-3 py-3 rounded-lg bg-blue-600 text-white text-center font-semibold hover:bg-blue-700">Log In</a>
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}
