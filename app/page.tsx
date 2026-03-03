"use client";
import Footer from '@/components/landing/Footer';
import RoleChoiceSection from '@/components/landing/RoleChoiceSection';
import NewHero from '@/components/landing/NewHero';
import OurMission from '@/components/landing/OurMission';
import ContactSection from '@/components/landing/ContactSection';
import HeaderSmooth from '@/components/landing/Header';

export default function Home() {
    return (
        <>
            {/* <Navbar />
             */}
                <HeaderSmooth />
            <main>
        
                <NewHero />
                <RoleChoiceSection />
                <OurMission />
                <ContactSection />
                {/* <HowItWorks /> */}
                {/* <About /> */}
            </main>
            <Footer />
        </>
    );
}