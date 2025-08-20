import React from "react";
//import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  // Let's assume a light blue and a dark blue from the visual style you're likely going for.
  // These are common colors for 'AI-powered' apps.
  // The subtle gradient background is also a modern touch.
  const gradientBg = 'bg-gradient-to-br from-green-50 via-green-100 to-white';
  const greenText = 'text-emerald-500';
  const darkText = 'text-emerald-700';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${gradientBg}`}>
      <div className="container mx-auto max-w-7xl">
        <header className="flex justify-between items-center py-4 px-6 md:px-0">
          <div className="flex items-center">
            <span className="text-xl font-bold text-green-700">TASKEEASE</span>
          </div>
          <nav className="hidden md:flex space-x-6 text-emerald-700">
            <a href="#" className="hover:text-green-900">Home</a>
            <a href="#" className="hover:text-green-900">How it works</a>
            <a href="#" className="hover:text-green-900">Blog</a>
          </nav>
          <div className="flex items-center space-x-4">
            <a href="#" className="hidden md:block text-emerald-700 hover:text-green-900">Sign in</a>
            <button className="bg-emerald-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-emerald-600 transition-colors">
              Sign up
            </button>
          </div>
        </header>

        <main className="flex flex-col md:flex-row items-center justify-between mt-12 md:mt-24">
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              <span className={darkText}>AI-Powered </span>
              <span className={greenText}>Therapy,</span>
              <span className={darkText}> Right in Your Pocket</span>
            </h1>
            <p className="mt-4 text-lg text-emerald-700 max-w-xl mx-auto md:mx-0">
              Find a new path to mental wellness with our AI-driven therapy platform. Experience compassionate support, personalized coping strategies, and real-time guidance tailored to your needs, all available anytime, anywhere.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start mt-8 space-y-4 md:space-y-0 md:space-x-4">
              <button className="bg-emerald-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-emerald-600 transition-colors shadow-lg">
                Get Started
              </button>
              <a href="#" className="text-emerald-500 font-semibold hover:underline">How it works?</a>
            </div>
          </div>
          <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
            {/* The image or illustration would go here. For a placeholder, we can use a simple div. */}
            <div className="w-80 h-80 md:w-96 md:h-96 bg-green-100 rounded-full flex items-center justify-center text-green-700">
              <p>Illustration Placeholder</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;