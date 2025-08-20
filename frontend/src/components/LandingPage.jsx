import React from "react";
import Lottie from "lottie-react";
import landingPageAnimation from "../assets/landingPageAnimation.json";

const LandingPage = () => {
  const gradientBg = "bg-gradient-to-br from-green-50 via-green-100 to-white";
  const greenText = "text-emerald-500";
  const darkText = "text-emerald-700";

  return (
    <div className={`min-h-screen ${gradientBg} overflow-x-hidden`}>
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <header className="flex justify-between items-center px-6 md:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-green-700">TASKEEASE</span>
          </div>
          <nav className="hidden md:flex space-x-6 lg:space-x-8 text-emerald-700 text-lg">
            <a href="#" className="hover:text-green-900">
              Home
            </a>
            <a href="#" className="hover:text-green-900">
              How it works
            </a>
            <a href="#" className="hover:text-green-900">
              Blog
            </a>
          </nav>
          <div className="flex items-center space-x-3 md:space-x-4">
            <a
              href="#"
              className="hidden md:block text-emerald-700 hover:text-green-900"
            >
              Sign in
            </a>
            <button className="bg-emerald-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-emerald-600 transition-colors">
              Sign up
            </button>
          </div>
        </header>

        {/* Main Section */}
        <main className="flex flex-col md:flex-row items-center justify-between mt-10 md:mt-16 gap-8 md:gap-12 lg:gap-14 px-6 md:pl-12 lg:pl-20">
          {/* Left Content */}
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-snug tracking-tight">
              <span className={darkText}>AI-Powered </span>
              <span className={greenText}>Therapy, </span>
              <span className={darkText}>Right in Your Pocket</span>
            </h1>
            <p className="mt-4 text-base md:text-lg text-emerald-700 max-w-xl mx-auto md:mx-0">
              Find a new path to mental wellness with our AI-driven therapy
              platform. Experience compassionate support, personalized coping
              strategies, and real-time guidance tailored to your needs, all
              available anytime, anywhere.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start mt-5 space-y-3 md:space-y-0 md:space-x-5">
              <button className="bg-emerald-500 text-white px-7 py-3 rounded-full font-semibold hover:bg-emerald-600 transition-colors shadow-lg">
                Get Started
              </button>
              <a href="#" className="text-emerald-500 font-semibold hover:underline">
                How it works?
              </a>
            </div>
          </div>

          {/* Right Animation */}
          <div className="md:w-1/2 flex justify-center">
            <div className="w-60 h-60 sm:w-72 sm:h-72 md:w-[340px] md:h-[340px] lg:w-[400px] lg:h-[400px] flex items-center justify-center">
              <Lottie
                animationData={landingPageAnimation}
                loop={true}
                autoplay={true}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;
