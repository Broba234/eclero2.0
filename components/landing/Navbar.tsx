"use client";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    return (
        <motion.nav
            variants={{
                visible: { y: 0, x: "-50%" },
                hidden: { y: "-150%", x: "-50%" },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{ left: '50%' }}
            className="fixed top-6 z-50 w-[95vw] max-w-xl rounded-full bg-white/80 backdrop-blur-xl shadow-[0_8px_40px_0_rgba(31,38,135,0.3)] border border-white/40 flex items-center justify-center px-8 py-3 ring-1 ring-white/20"
        >
            <div className="flex items-center gap-4 absolute left-8 top-1/2 -translate-y-1/2">
                <Link href="/#how-it-works" className="text-gray-700 hover:text-blue-600 font-medium">How it Works</Link>
            </div>
            <div className="flex-1 flex justify-center">
                <Link href="/" className="font-extrabold text-xl md:text-2xl tracking-tight text-blue-600">eclero</Link>
            </div>
            <div className="flex items-center gap-4 absolute right-8 top-1/2 -translate-y-1/2">
                <Link href="#about" className="text-gray-700 hover:text-blue-600 font-medium">About</Link>
                <Link href="/auth/login" className="inline-flex items-center gap-2 ml-2 py-2 px-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all duration-300 hover:scale-105 shadow-lg">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    Log In
                </Link>
            </div>
        </motion.nav>
    );
}