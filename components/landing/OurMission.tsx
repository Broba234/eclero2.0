import React from 'react';
import { BookOpen, Users, Target, GraduationCap } from 'lucide-react';

const OurMission = () => {
  return (
    <section id="our-mission" className=" px-4 sm:px-6 lg:px-8 py-[150px] bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900">Our Mission</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Guiding educational excellence through meaningful connections and accessible learning
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
          {/* Left Column - Mission Statement */}
          <div className="space-y-8 h-full flex flex-col justify-between">
            <div className="bg-white rounded-ss-[80px] rounded-ee-[80px] p-8 shadow-lg border border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <GraduationCap className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    The Eclero Principle
                  </h3>
                  <p className="text-gray-700 italic">
                    "Education should be accessible to everyone."
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Founded on the fundamental belief that learning is a lifelong journey, 
                we recognize that the most effective education comes from connecting 
                with those who possess both knowledge and practical experience.
              </p>
              
              <div className="p-4 bg-blue-50 rounded-se-[50px] rounded-es-[50px] border-l-4 border-blue-500">
                <p className="text-gray-800 font-medium">
                  We believe in learning through shared wisdom, where every interaction 
                  becomes an opportunity for growth and understanding.
                </p>
              </div>
            </div>

            {/* Key Principles */}
            <div className="grid sm:grid-cols-2 gap-4 items-stretch">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <BookOpen className="h-8 w-8 text-blue-500 mb-3" />
                <h4 className="font-bold text-gray-900 mb-2">Lifelong Learning</h4>
                <p className="text-sm text-gray-600">
                  Education extends beyond classrooms, embracing every stage of life
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <Users className="h-8 w-8 text-indigo-500 mb-3" />
                <h4 className="font-bold text-gray-900 mb-2">Community First</h4>
                <p className="text-sm text-gray-600">
                  Knowledge flourishes in collaborative, supportive environments
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Global Vision */}
          <div className="bg-[#1559C6]/80 rounded-se-[100px] p-8 text-white shadow-xl">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">Building a Global Learning Ecosystem</h3>
              <p className="text-blue-100 mb-6">
                Our vision is to create an interconnected community where knowledge flows freely 
                between learners and educators across borders and disciplines.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <span className="font-bold text-lg">01</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">For Students</h4>
                  <p className="text-blue-100">
                    Overcome academic challenges with personalized guidance from experts 
                    who genuinely care about your success
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <span className="font-bold text-lg">02</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">For Educators</h4>
                  <p className="text-blue-100">
                    Share your passion and expertise, shaping the next generation of 
                    thinkers and doers through meaningful mentorship
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <span className="font-bold text-lg">03</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">Our Commitment</h4>
                  <p className="text-blue-100">
                    To provide a platform where every educational goal is attainable, 
                    supported by a community dedicated to collective growth
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-lg">
            <BookOpen className="h-5 w-5" />
            <span className="font-semibold">Begin Your Learning Journey Today</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurMission;