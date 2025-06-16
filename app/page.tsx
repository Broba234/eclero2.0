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
            <div
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
                        <div className="relative w-full max-w-6xl mx-auto flex justify-between items-start">
                            <div className="flex flex-col items-center text-center w-1/2 px-4">
                                <motion.h2
                                    style={{ x: leftX }}
                                    className="text-5xl md:text-7xl text-white font-extrabold drop-shadow-lg leading-tight"
                                >
                                    Learn <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">Faster.</span>
                                </motion.h2>

                                <motion.div
                                    style={{ opacity: descriptionOpacity, x: leftX }}
                                    className="mt-12 text-gray-300 text-lg md:text-xl max-w-sm"
                                >
                                    <h3 className="text-2xl font-semibold text-white mb-4">For Students</h3>
                                    <p className="text-left leading-relaxed">
                                        Eclero connects students directly to tutors in an open marketplace where students access affordable tutor help on-demand — whether for exams, assignments, or concept mastery — at rates that fit every budget.
                                    </p>
                                </motion.div>
                            </div>

                            <div className="flex flex-col items-center text-center w-1/2 px-4">
                                <motion.h2
                                    style={{ x: rightX }}
                                    className="text-5xl md:text-7xl text-white font-extrabold drop-shadow-lg leading-tight"
                                >
                                    Earn <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">Smarter.</span>
                                </motion.h2>

                                <motion.div
                                    style={{ opacity: descriptionOpacity, x: rightX }}
                                    className="mt-12 text-gray-300 text-lg md:text-xl max-w-sm"
                                >
                                    <h3 className="text-2xl font-semibold text-white mb-4">For Tutors</h3>
                                    <p className="text-left leading-relaxed">
                                        Eclero empowers students not only to learn but to earn. If you're skilled in a subject, you can instantly become a tutor and monetize your knowledge. Build your own schedule, set your prices, and get paid helping others succeed — all while we handle discovery, bookings, and payments.
                                    </p>
                                </motion.div>
                            </div>
                        </div>

                        <div className="mt-[-6rem] flex flex-col sm:flex-row justify-center items-center gap-6">
                            <a href="/auth/register?role=student" className="rounded-full bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:scale-105">
                                Start learning
                            </a>
                            <a
                                href="/auth/register?role=tutor"
                                className="rounded-full bg-[#d6d8e0] font-semibold px-8 py-4 text-lg shadow-lg hover:scale-105 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
                            >
                                Start earning
                            </a>
                        </div>

                        <motion.div
                            style={{ opacity: subtitleOpacity, x: useTransform(scrollYProgress, [0, 0.15], ["0vw", "0vw"]) }}
                            className="mt-16 text-center text-gray-300 text-xl md:text-2xl max-w-2xl"
                        >
                            Eclero is a <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text font-bold">first of its kind, Peer-to-Peer Tutoring Platform</span>, connecting students seeking help to students providing it, across every subject, on-demand.
                        </motion.div>
                    </div>
                </div>
            </div>
        </ParallaxProvider>
    );
}
