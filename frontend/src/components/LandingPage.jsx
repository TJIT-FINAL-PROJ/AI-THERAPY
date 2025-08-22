import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import landingPageAnimation from "../assets/landingPageAnimation1.json";
import OnboardingModal from "../components/OnboardingModal";

const LandingPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

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

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (showOnboarding) {
    return <OnboardingModal onComplete={() => navigate("/chat")} />;
  }

  return (
    <div className="h-[100vh] flex flex-col bg-gradient-to-br from-green-50 via-green-100 to-white overflow-x-hidden">
      {/* Header */}
      <header className="w-full flex justify-between items-center py-4 px-12 md:px-28">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-green-700">TASKEEASE</span>
        </div>
        <div className="flex items-center space-x-4">
          {!user ? (
            <>
              <Link to="/auth?mode=login" className="text-emerald-700 hover:text-green-900">
                Sign in
              </Link>
              <Link
                to="/auth?mode=signup"
                className="bg-emerald-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-emerald-600"
              >
                Sign up
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-emerald-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-emerald-600"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-12 md:px-20 lg:px-28">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-6xl">
          <div className="md:w-2/3 text-center md:text-left">
            <h1 className="text-5xl font-extrabold leading-snug">
              <span className="text-emerald-700">AI-Powered </span>
              <span className="text-emerald-500">Therapy, </span>
              <span className="text-emerald-700">Right in Your Pocket</span>
            </h1>
            <p className="mt-4 text-lg text-emerald-700">
              Find a new path to mental wellness with our AI-driven therapy platform. 
              Experience compassionate support, personalized coping strategies, 
              and real-time guidance tailored to your needs, all available anytime, anywhere.
            </p>
            <div className="mt-5 flex gap-4 justify-center md:justify-start">
              <Link
                to="/auth?mode=signup"
                className="bg-emerald-500 text-white px-7 py-3 rounded-full font-semibold hover:bg-emerald-600 shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="md:w-1/2 flex justify-center">
            <Lottie animationData={landingPageAnimation} loop autoplay className="w-[500px] h-[500px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
