import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white text-center p-8 relative overflow-hidden"
    >
      {/* Decorative background blur circles */}
      <div className="pointer-events-none absolute top-20 left-20 w-72 h-72 bg-pink-400 rounded-full blur-3xl opacity-30 animate-pulse" />
      <div className="pointer-events-none absolute bottom-20 right-20 w-72 h-72 bg-indigo-400 rounded-full blur-3xl opacity-30 animate-pulse" />

      <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 drop-shadow-lg">
        Welcome to <span className="text-yellow-300">AI Therapy</span>
      </h1>

      <p className="text-base sm:text-lg max-w-2xl mb-10 text-white/90 leading-relaxed">
        Your personal AI-powered mental wellness companion. Take the first step toward a calmer, healthier mind today.
      </p>

      <button
        onClick={() => navigate("/auth")}
        className="px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-bold bg-white text-indigo-700 rounded-2xl shadow-xl hover:scale-110 hover:shadow-2xl transition-transform duration-300 ease-in-out"
      >
        Get Started
      </button>
    </section>
  );
};

export default LandingPage;
