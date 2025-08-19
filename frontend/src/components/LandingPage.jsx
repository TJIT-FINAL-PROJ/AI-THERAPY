import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <section className="h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-blue-500 to-indigo-700 text-white">
      <h1 className="text-5xl font-bold mb-6">Welcome to AI Therapy</h1>
      <p className="text-lg mb-8">Your personal AI-powered wellness companion</p>
      <button
        onClick={() => navigate("/auth")}
        className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-semibold hover:scale-110 transition"
      >
        Get Started
      </button>
    </section>
  );
};

export default LandingPage;
