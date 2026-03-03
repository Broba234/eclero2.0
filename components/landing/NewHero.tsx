// components/HeroSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, GraduationCap, ArrowRight, PlayCircle } from 'lucide-react';
import StudentIllustration from './illustrations/StudentIllustration';
import TutorIllustration from './illustrations/TutorIllustration';

export default function NewHero() {
  const [activeSection, setActiveSection] = useState<'student' | 'tutor'>('student');

  useEffect(() => {
    // Auto-rotate sections every 7 seconds
    const interval = setInterval(() => {
      setActiveSection(prev => (prev === 'student' ? 'tutor' : 'student'));
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const handleSectionChange = (section: 'student' | 'tutor') => {
    if (section !== activeSection) {
      setActiveSection(section);
    }
  };

  return (
    <section className="relative min-h-[100dvh] overflow-hidden w-full bg-opacity-20 bg-gradient-to-br from-[#F8F8F8] via-[#EBF2FF] to-[#EBF2FF]">
          {/* Decorative background shapes */}
          <div className="absolute w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] -top-10 sm:-top-16 lg:-top-20 left-0 opacity-30">
            <svg viewBox="0 0 400 400" fill="none" className="w-full h-full">
              <circle cx="200" cy="200" r="180" fill="url(#leftBlob)" />
              <defs>
                <radialGradient id="leftBlob" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#dbeafe" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>
          <div className="absolute w-[200px] sm:w-[350px] md:w-[450px] lg:w-[600px] h-full z-0 top-0 bottom-0 -right-[60px] sm:-right-[80px] md:-right-[90px] lg:-right-[110px] opacity-20">
            <svg viewBox="0 0 400 600" fill="none" className="w-full h-full">
              <ellipse cx="250" cy="300" rx="200" ry="280" fill="url(#rightBlob)" />
              <defs>
                <radialGradient id="rightBlob" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a5b4fc" />
                  <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>
      {/* Background Images that crossfade */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          initial={false}
          animate={{ opacity: activeSection === 'student' ? 1 : 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
        
        </motion.div>
        <motion.div
          initial={false}
          animate={{ opacity: activeSection === 'tutor' ? 1 : 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* <Image
            src="/teacher.png"
            alt="Tutor teaching"
            fill
            sizes="100vw"
            className="object-cover"
          /> */}
        </motion.div>
        {/* Light gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/75 to-white/30" />
      </div>
      
      {/* Navigation Dots - bottom center on mobile, right side on desktop */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:bottom-auto lg:left-auto lg:right-8 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0 z-20 flex flex-row lg:flex-col gap-3 lg:gap-4">
        <button
          onClick={() => handleSectionChange('student')}
          className={`block w-3 h-3 rounded-full transition-all duration-300 ${
            activeSection === 'student' 
              ? 'bg-blue-600 scale-125' 
              : 'bg-gray-300 hover:bg-gray-400'
          }`}
        />
        <button
          onClick={() => handleSectionChange('tutor')}
          className={`block w-3 h-3 rounded-full transition-all duration-300 ${
            activeSection === 'tutor' 
              ? 'bg-purple-600 scale-125' 
              : 'bg-gray-300 hover:bg-gray-400'
          }`}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 min-h-[100dvh] py-8 sm:py-12 lg:py-0 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 w-full">
          {/* Text Section */}
          <AnimatePresence mode="wait">
            {activeSection === 'student' && (
              <motion.div
                key="student"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="flex flex-col justify-center mt-20 md:mt-0 space-y-4 sm:space-y-6 lg:space-y-8"
              >
                {/* <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold"
                >
                  <BookOpen className="w-4 h-4" />
                  For Students
                </motion.div> */}

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Smart Learning
                  </span>
                  <br />
                  <span className="text-gray-800">Deeper & More Effective</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-gray-600 text-base sm:text-lg max-w-2xl"
                >
                  Transform your learning experience with AI-powered personalized 
                  study plans, interactive content, and real-time progress tracking. 
                  Master complex concepts faster with our adaptive learning system.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                >
                  {/* <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1"> */}
                    <span className="flex items-center cursor-pointer underline gap-2 text-blue-600 py-2 sm:py-0">
                      View More Courses
                      <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-2 transition-transform" />
                    </span>
                  {/* </button> */}
                  {/* <button className="group px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300 flex items-center gap-2 justify-center"> */}
                  <span className="flex items-center cursor-pointer underline gap-2 text-blue-600 py-2 sm:py-0">
                  <PlayCircle className="w-5 h-5 shrink-0" />
                  Watch Demo
                  </span>
                  {/* </button> */}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8 pt-4"
                >
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-800">50K+</div>
                    <div className="text-sm sm:text-base text-gray-600">Active Students</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-800">95%</div>
                    <div className="text-sm sm:text-base text-gray-600">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-800">4.9</div>
                    <div className="text-sm sm:text-base text-gray-600">Avg. Rating</div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeSection === 'tutor' && (
              <motion.div
                key="tutor"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="flex flex-col justify-center mt-20 md:mt-0 space-y-4 sm:space-y-6 lg:space-y-8"
              >
                {/* <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold"
                >
                  <Users className="w-4 h-4" />
                  For Tutors & Educators
                </motion.div> */}

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Inspire Minds
                  </span>
                  <br />
                  <span className="text-gray-800">Shape Futures</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-gray-600 text-base sm:text-lg max-w-2xl"
                >
                  Join our elite community of educators. Access cutting-edge 
                  teaching tools, expand your reach globally, and transform 
                  lives through quality education. Share your expertise with 
                  thousands of eager learners.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                >
                  {/* <button className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-1"> */}
                    <span className="flex items-center cursor-pointer underline gap-2 text-purple-600 py-2 sm:py-0">
                      Become a Tutor
                      <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-2 transition-transform" />
                    </span>
                  {/* </button> */} 
                  <span className="flex items-center cursor-pointer underline gap-2 text-purple-600 py-2 sm:py-0">
                    View Success Stories
                    <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-2 transition-transform" />
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pt-4"
                >
                  <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
                    <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2" />
                    <div className="font-semibold text-gray-800 text-sm sm:text-base">Flexible Schedule</div>
                    <div className="text-xs sm:text-sm text-gray-600">Teach on your terms</div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2" />
                    <div className="font-semibold text-gray-800 text-sm sm:text-base">Premium Tools</div>
                    <div className="text-xs sm:text-sm text-gray-600">Advanced teaching aids</div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 sm:col-span-2 md:col-span-1">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2" />
                    <div className="font-semibold text-gray-800 text-sm sm:text-base">Global Reach</div>
                    <div className="text-xs sm:text-sm text-gray-600">Students worldwide</div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visual Container - responsive height */}
          <div className="relative lg:col-span-1">
            <div className="relative h-[220px] sm:h-[300px] md:h-[400px] lg:h-[600px] w-full">
              {/* Student Illustration */}
              <motion.div
                initial={{ opacity: 1, scale: 1, x: 0 }}
                animate={{
                  scale: activeSection === 'student' ? 1 : 0.9,
                  opacity: activeSection === 'student' ? 1 : 0,
                  x: activeSection === 'student' ? 0 : -50
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <StudentIllustration />
              </motion.div>

              {/* Tutor Illustration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                animate={{
                  scale: activeSection === 'tutor' ? 1 : 0.9,
                  opacity: activeSection === 'tutor' ? 1 : 0,
                  x: activeSection === 'tutor' ? 0 : 50
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <TutorIllustration />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}