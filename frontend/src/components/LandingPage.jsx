// src/pages/LandingPage.jsx
import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import landingPageAnimation from "../assets/landingPageAnimation1.json";
import OnboardingModal from "../components/OnboardingModal";
import { Moon, Sun } from "lucide-react"; // using lucide-react icons for toggle

const LandingPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // local toggle for demo
  const navigate = useNavigate();

  // Handle supabase session (unchanged)
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        if (!currentUser.user_metadata?.mood || !currentUser.user_metadata?.goal) {
          setShowOnboarding(true);
        } else {
          navigate("/chat");
        }
      }
      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        if (!currentUser.user_metadata?.mood || !currentUser.user_metadata?.goal) {
          setShowOnboarding(true);
        } else {
          navigate("/chat");
        }
      } else {
        setShowOnboarding(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowOnboarding(false);
  };

  // Toggle dark mode (local)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center dark:text-gray-200">Loading...</div>;
  }

  if (showOnboarding) {
    return <OnboardingModal onClose={() => navigate("/chat")} />;
  }

  const gradientBg =
    "bg-gradient-to-br from-pink-50 via-rose-100 to-peach-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900";
  const primaryText = "text-pink-600 dark:text-pink-400";
  const darkText = "text-pink-700 dark:text-pink-300";

  return (
    <div className={`h-[100vh] flex flex-col ${gradientBg} overflow-x-hidden transition-colors duration-300`}>
      {/* Header */}
      <header className="w-full flex justify-between items-center py-4 px-12 md:px-28 bg-transparent relative">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-pink-700 dark:text-pink-400">MINDEASE</span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex space-x-6 lg:space-x-8 text-pink-700 dark:text-pink-300 text-lg">
          <a href="#" className="hover:text-pink-900 dark:hover:text-pink-400">Home</a>
          <a href="#" className="hover:text-pink-900 dark:hover:text-pink-400">How it works</a>
          <a href="#" className="hover:text-pink-900 dark:hover:text-pink-400">Blog</a>
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {!user ? (
            <>
              <Link
                to="/auth?mode=login"
                className="hidden md:block text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-pink-400"
              >
                Sign in
              </Link>
              <Link
                to="/auth?mode=signup"
                className="bg-pink-600 dark:bg-pink-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-pink-700 dark:hover:bg-pink-400 transition-colors"
              >
                Sign up
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-pink-600 dark:bg-pink-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-pink-700 dark:hover:bg-pink-400 transition-colors"
            >
              Logout
            </button>
          )}

          {/* 🌗 Theme Toggle */}
          <button
            onClick={() => setIsDarkMode((prev) => !prev)}
            className="ml-3 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-800" />
            )}
          </button>
        </div>
      </header>

      {/* Main Section */}
      <div className="flex-1 flex items-center justify-center px-12 md:px-20 lg:px-28">
        <div className="mx-auto w-full max-w-[90rem]">
          <main className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 lg:gap-8">
            {/* Left Content */}
            <div className="md:w-2/3 text-center md:text-left px-4 sm:px-6 md:pl-8">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-snug tracking-tight">
                <span className={darkText}>AI-Powered </span>
                <span className={primaryText}>Therapy, </span>
                <span className={darkText}>Right in Your Pocket</span>
              </h1>
              <p className="mt-4 text-base md:text-lg text-pink-700 dark:text-pink-300 max-w-xl mx-auto md:mx-0">
                Find a new path to mental wellness with our AI-driven therapy platform.
                Experience compassionate support, personalized coping strategies,
                and real-time guidance tailored to your needs, all available anytime, anywhere.
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start mt-5 space-y-3 md:space-y-0 md:space-x-5">
                <Link
                  to="/auth?mode=signup"
                  className="bg-pink-600 dark:bg-pink-500 text-white px-7 py-3 rounded-full font-semibold hover:bg-pink-700 dark:hover:bg-pink-400 transition-colors shadow-lg text-center"
                >
                  Get Started
                </Link>
                <a href="#" className="text-pink-600 dark:text-pink-400 font-semibold hover:underline">
                  How it works?
                </a>
              </div>
            </div>

            {/* Right Animation */}
            <div className="md:w-1/2 flex justify-center md:justify-end">
              <div className="w-80 h-80 sm:w-[420px] sm:h-[420px] md:w-[500px] md:h-[500px] lg:w-[560px] lg:h-[560px] flex items-center justify-center">
                <Lottie animationData={landingPageAnimation} loop={true} autoplay={true} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
