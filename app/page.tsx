"use client";
import { useRef } from "react";
import { ParallaxProvider } from 'react-scroll-parallax';
import { motion, useScroll, useTransform } from "framer-motion";

export default function Home() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

    const leftX = useTransform(scrollYProgress, [0, 0.3], ["-0.1vw", "-15vw"]);
    const rightX = useTransform(scrollYProgress, [0, 0.3], ["0.1vw", "15vw"]);

    const subtitleOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
    const buttonOpacity = useTransform(scrollYProgress, [0.15, 0.35], [0, 1]);
    const descriptionOpacity = useTransform(scrollYProgress, [0.3, 0.5], [0, 1]);

    return (
        <ParallaxProvider>
            {/* Navbar only on landing page */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-lg rounded-full bg-white/70 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-gray-200 flex items-center justify-center px-6 py-2 ring-1 ring-white/30 transition-all duration-200 hover:scale-105 hover:opacity-95">
                {/* Left links */}
                <div className="flex items-center gap-4 absolute left-8 top-1/2 -translate-y-1/2">
                    <a href="/#how-it-works" className="text-gray-700 hover:text-blue-600 font-medium">How it Works</a>
                    <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Pricing</a>
                </div>
                {/* Center logo */}
                <div className="flex-1 flex justify-center">
                    <a href="/" className="font-extrabold text-xl md:text-2xl tracking-tight text-blue-600">eclero</a>
                </div>
                {/* Right links */}
                <div className="flex items-center gap-4 absolute right-8 top-1/2 -translate-y-1/2">
                    <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">About</a>
                    <a href="/auth/login" className="ml-2 py-1.5 px-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">Log In</a>
                </div>
            </nav>
            <motion.div
                className="min-h-screen"
                style={{
                    background: useTransform(
                        scrollYProgress,
                        [0, 1],
                        [
                            "linear-gradient(to bottom, #2b3340, #23272f, #181a1b)",
                            "linear-gradient(to bottom, #3a4a60, #2b3340, #181a1b)"
                        ]
                    )
                }}
            >
                <div ref={containerRef} className="relative h-[300vh]">
                    <div className="sticky top-0 h-screen flex flex-col justify-center items-center">
                        <div className="relative w-full max-w-5xl mx-auto flex flex-row justify-center items-start gap-8">
                            <div className="flex flex-col items-center w-1/2">
                                <motion.h2
                                    style={{ x: leftX }}
                                    className="text-4xl md:text-6xl text-white font-extrabold drop-shadow-lg leading-tight pr-2"
                                >
                                    Learn <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">Faster.</span>
                                </motion.h2>
                                <motion.div
                                    style={{ opacity: descriptionOpacity, x: leftX }}
                                    className="mt-8 text-gray-300 text-base md:text-lg max-w-xs mx-auto"
                                >
                                    <h3 className="text-xl font-semibold text-white mb-3">For Students</h3>
                                    <p className="text-left leading-relaxed">
                                        Eclero connects students directly to tutors in an open marketplace where students access affordable tutor help on-demand — whether for exams, assignments, or concept mastery — at rates that fit every budget.
                                    </p>
                                </motion.div>
                            </div>
                            <div className="flex flex-col items-center w-1/2">
                                <motion.h2
                                    style={{ x: rightX }}
                                    className="text-4xl md:text-6xl text-white font-extrabold drop-shadow-lg leading-tight pl-2"
                                >
                                    Earn <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">Smarter.</span>
                                </motion.h2>
                                <motion.div
                                    style={{ opacity: descriptionOpacity, x: rightX }}
                                    className="mt-8 text-gray-300 text-base md:text-lg max-w-xs mx-auto"
                                >
                                    <h3 className="text-xl font-semibold text-white mb-3">For Tutors</h3>
                                    <p className="text-left leading-relaxed">
                                        Eclero empowers students not only to learn but to earn. If you're skilled in a subject, you can instantly become a tutor and monetize your knowledge. Build your own schedule, set your prices, and get paid helping others succeed — all while we handle discovery, bookings, and payments.
                                    </p>
                                </motion.div>
                            </div>
                        </div>

                        <div
                            className="mt-[-4.8rem] flex flex-col sm:flex-row justify-center items-center gap-4 z-50"
                            style={{ pointerEvents: "auto" }}
                        >
                            <a href="/auth/register?role=student" className="rounded-full bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold px-6 py-3 text-base shadow-lg hover:scale-105">
                                Start learning
                            </a>
                            <a
                                href="/auth/register?role=tutor"
                                className="rounded-full bg-[#d6d8e0] font-semibold px-6 py-3 text-base shadow-lg hover:scale-105 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
                            >
                                Start earning
                            </a>
                        </div>

                        <motion.div
                            style={{ opacity: subtitleOpacity, x: useTransform(scrollYProgress, [0, 0.15], ["0vw", "0vw"]) }}
                            className="mt-12 text-center text-gray-300 text-lg md:text-xl max-w-xl"
                        >
                            Eclero is a <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text font-bold">first of its kind, Peer-to-Peer Tutoring Platform</span>, connecting students seeking help to students providing it, across every subject, on-demand.
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </ParallaxProvider>
    );
}
