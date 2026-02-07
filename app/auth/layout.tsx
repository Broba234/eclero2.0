"use client";
import HeaderSmooth from '@/components/landing/Header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderSmooth />
      {children}
    </>
  );
}
