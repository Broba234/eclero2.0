"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Hero() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

    // Title animations - extend the pause where titles remain perfectly still, then slide out later
    const leftX = useTransform(scrollYProgress, [0, 0.7, 0.8, 0.98], ["0vw", "0vw", "-0.1vw", "-100vw"]);
    const rightX = useTransform(scrollYProgress, [0, 0.7, 0.8, 0.98], ["0vw", "0vw", "0.1vw", "100vw"]);
    const titleSectionOpacity = useTransform(scrollYProgress, [0, 0.75, 0.9, 0.99], [1, 1, 1, 0]);
    // NO Y movement - titles stay at exact same vertical position

    // Description animations - appear earlier and remain longer during the extended pause
    const descriptionOpacity = useTransform(scrollYProgress, [0.05, 0.2, 0.88, 0.98], [0, 1, 1, 0]);
    const descriptionY = useTransform(scrollYProgress, [0.05, 0.2], ["30px", "0px"]);

    // CTA buttons stay visible on load but disappear as the hero scrolls away
    const ctaOpacity = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6], [1, 1, 0.5, 0]);
    const ctaPointerEvents = useTransform(scrollYProgress, (value) => (value > 0.55 ? "none" : "auto"));

    return (
        <motion.div
            className="min-h-[85svh] sm:min-h-screen relative overflow-hidden"
            style={{
                background: useTransform(
                    scrollYProgress,
                    [0, 1],
                    [
                        "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)",
                        "linear-gradient(135deg, #764ba2 0%, #667eea 50%, #764ba2 100%)"
                    ]
                )
            }}
        >
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-700"></div>
                <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            {/* Desktop/Large screens: fixed titles with motion */}
            <motion.div 
                style={{ 
                    opacity: titleSectionOpacity,
                    position: "fixed",
                    top: "25vh",
                    left: "0",
                    right: "0",
                    zIndex: 20,
                    transform: "none"
                }} 
                className="hidden lg:flex items-center justify-center pointer-events-none"
            >
                <div className="grid grid-cols-2 gap-16 items-start w-full max-w-7xl mx-auto px-4">
                    {/* Left side - Learn */}
                    <motion.div 
                        style={{ x: leftX }}
                        className="text-left space-y-6"
                    >
                        <h2 className="text-5xl md:text-7xl text-white font-black leading-none">
                            Learn <span className="bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text">Faster</span>
                        </h2>
                        <motion.div
                            style={{ 
                                opacity: descriptionOpacity,
                                y: descriptionY
                            }}
                            className="text-blue-100 text-base md:text-lg leading-relaxed max-w-md bg-white/10 rounded-xl p-4 backdrop-blur-sm min-h-[96px]"
                        >
                            <span className="block">Connect instantly with vetted peer tutors across STEM, humanities, and languages.</span>
                            <span className="block">Collaborate via whiteboard, screen share, and file uploads for faster exam prep.</span>
                        </motion.div>
                    </motion.div>
                    
                    {/* Right side - Earn */}
                    <motion.div 
                        style={{ x: rightX }}
                        className="text-right space-y-6"
                    >
                        <h2 className="text-5xl md:text-7xl text-white font-black leading-none">
                            Earn <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">Smarter</span>
                        </h2>
                        <motion.div
                            style={{ 
                                opacity: descriptionOpacity,
                                y: descriptionY
                            }}
                            className="text-purple-100 text-base md:text-lg leading-relaxed max-w-md ml-auto bg-white/10 rounded-xl p-4 backdrop-blur-sm min-h-[96px]"
                        >
                            <span className="block">Turn your expertise into income with flexible scheduling and transparent payouts.</span>
                            <span className="block">Set your rates, earn trust with verified reviews, and help learners thrive.</span>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Mobile/Tablet: static, stacked content to avoid overlap */}
            <div className="lg:hidden relative z-20 px-4 pt-28 pb-10">
                <div className="max-w-2xl mx-auto space-y-10">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl sm:text-5xl text-white font-black leading-tight">
                            Learn <span className="bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text">Faster</span>
                        </h2>
                        <div className="text-blue-100 text-base leading-relaxed bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <span className="block">Connect instantly with vetted peer tutors across STEM, humanities, and languages.</span>
                            <span className="block">Collaborate via whiteboard, screen share, and file uploads for faster exam prep.</span>
                        </div>
                    </div>
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl sm:text-5xl text-white font-black leading-tight">
                            Earn <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">Smarter</span>
                        </h2>
                        <div className="text-purple-100 text-base leading-relaxed bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <span className="block">Turn your expertise into income with flexible scheduling and transparent payouts.</span>
                            <span className="block">Set your rates, earn trust with verified reviews, and help learners thrive.</span>
                        </div>
                    </div>
                </div>
                {/* Mobile buttons in normal flow */}
                <motion.div
                    className="mt-8 flex flex-col items-center"
                    style={{ opacity: ctaOpacity, pointerEvents: ctaPointerEvents }}
                >
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-md mx-auto">
                        <a 
                            href="/auth/register?role=student" 
                            className="group relative inline-flex items-center justify-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-3 text-white font-bold text-base transition-all duration-300 hover:bg-white/30 hover:scale-105 shadow-2xl w-full"
                        >
                            <div className="w-2 h-2 bg-cyan-400 rounded-full group-hover:animate-pulse"></div>
                            Start Learning
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                        <a
                            href="/auth/register?role=tutor"
                            className="group relative inline-flex items-center justify-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-3 text-white font-bold text-base transition-all duration-300 hover:bg-white/30 hover:scale-105 shadow-2xl w-full"
                        >
                            <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:animate-pulse"></div>
                            Start Earning
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                    </div>
                </motion.div>
            </div>

            <div ref={containerRef} className="hidden lg:block relative h-[200vh] z-10">
                <div className="sticky top-0 h-screen flex flex-col justify-center items-center px-4">

                    {/* Desktop buttons - fixed until white section covers */}
                    <motion.div
                        style={{ 
                            opacity: ctaOpacity,
                            pointerEvents: ctaPointerEvents,
                            position: "fixed",
                            top: "70vh",
                            left: "0",
                            right: "0",
                            zIndex: 25
                        }}
                        className="hidden lg:flex flex-col items-center"
                    >
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 w-full max-w-4xl mx-auto px-4">
                            <a 
                                href="/auth/register?role=student" 
                                className="group relative inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-8 py-4 text-white font-bold text-lg transition-all duration-300 hover:bg-white/30 hover:scale-105 shadow-2xl"
                            >
                                <div className="w-2 h-2 bg-cyan-400 rounded-full group-hover:animate-pulse"></div>
                                Start Learning
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </a>
                            
                            <a
                                href="/auth/register?role=tutor"
                                className="group relative inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-8 py-4 text-white font-bold text-lg transition-all duration-300 hover:bg-white/30 hover:scale-105 shadow-2xl"
                            >
                                <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:animate-pulse"></div>
                                Start Earning
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </a>
                        </div>
                    </motion.div>

                    
                    
                </div>
            </div>
        </motion.div>
    )
}
