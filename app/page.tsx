"use client";
import { ParallaxProvider } from 'react-scroll-parallax';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import About from '@/components/landing/About';
import Footer from '@/components/landing/Footer';

export default function Home() {
    return (
        <ParallaxProvider>
            <Navbar />
            <main>
                <Hero />
                <HowItWorks />
                <About />
            </main>
            <Footer />
        </ParallaxProvider>
    );
}