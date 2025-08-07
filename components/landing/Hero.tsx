"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Hero() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

    // Title animations - move away on later scroll
    const leftX = useTransform(scrollYProgress, [0.4, 0.8], ["-0.1vw", "-100vw"]);
    const rightX = useTransform(scrollYProgress, [0.4, 0.8], ["0.1vw", "100vw"]);
    const titleSectionOpacity = useTransform(scrollYProgress, [0.4, 0.7], [1, 0]);
    const titleSectionY = useTransform(scrollYProgress, [0.4, 0.7], ["0vh", "-30vh"]);

    // Description animations - appear under titles on early scroll
    const descriptionOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
    const descriptionY = useTransform(scrollYProgress, [0.1, 0.3], ["20px", "0px"]);

    // Button animations - positioned lower, stay visible
    const buttonY = useTransform(scrollYProgress, [0, 0.5], ["60vh", "50vh"]);
    const buttonOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8], [1, 1, 1]);

    return (
        <motion.div
            className="min-h-screen relative overflow-hidden"
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
            
            <div ref={containerRef} className="relative h-[150vh] z-10">
                <div className="sticky top-0 h-screen flex flex-col justify-center items-center px-4">
                    {/* Main titles and descriptions - positioned higher, scroll away together */}
                    <motion.div 
                        style={{ 
                            opacity: titleSectionOpacity, 
                            y: titleSectionY
                        }} 
                        className="absolute top-1/4 left-0 right-0 flex items-center justify-center"
                    >
                        <div className="grid lg:grid-cols-2 gap-16 items-start w-full max-w-7xl mx-auto px-4">
                            {/* Left side - Learn */}
                            <motion.div 
                                style={{ x: leftX }}
                                className="text-center lg:text-left space-y-6"
                            >
                                <h2 className="text-5xl md:text-7xl text-white font-black leading-none">
                                    Learn <span className="bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text">Faster</span>
                                </h2>
                                <motion.div
                                    style={{ 
                                        opacity: descriptionOpacity,
                                        y: descriptionY
                                    }}
                                    className="text-blue-100 text-lg leading-relaxed max-w-md mx-auto lg:mx-0"
                                >
                                    Connect with skilled peer tutors in our open marketplace. Get affordable, on-demand help for exams, assignments, and concept mastery.
                                </motion.div>
                            </motion.div>
                            
                            {/* Right side - Earn */}
                            <motion.div 
                                style={{ x: rightX }}
                                className="text-center lg:text-right space-y-6"
                            >
                                <h2 className="text-5xl md:text-7xl text-white font-black leading-none">
                                    Earn <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">Smarter</span>
                                </h2>
                                <motion.div
                                    style={{ 
                                        opacity: descriptionOpacity,
                                        y: descriptionY
                                    }}
                                    className="text-purple-100 text-lg leading-relaxed max-w-md mx-auto lg:mx-0 lg:ml-auto"
                                >
                                    Monetize your knowledge by becoming a tutor. Set your schedule, your prices, and help peers succeed while earning.
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Action buttons - positioned lower */}
                    <motion.div
                        style={{ y: buttonY, opacity: buttonOpacity }}
                        className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-50"
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
