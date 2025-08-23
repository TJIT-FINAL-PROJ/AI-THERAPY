import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import OnboardingModal from "../components/OnboardingModal";

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode");

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (mode === "signup") setIsLogin(false);
    else setIsLogin(true);
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        const user = data.user;
        if (!user?.user_metadata?.mood || !user?.user_metadata?.goal) {
          setShowOnboarding(true);
        } else {
          navigate("/chat");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        setShowOnboarding(true);
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) setMessage(error.message);
  };

  const handleOtpLogin = async () => {
    if (!email) return alert("Please enter your email first");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage(error.message);
    else alert("📩 Check your email for a login link!");
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-50 via-white to-green-100">
      {showOnboarding && (
        <OnboardingModal onComplete={() => navigate("/chat")} />
      )}

      {!showOnboarding && (
        <div className="bg-white shadow-xl rounded-2xl p-8 w-[90%] max-w-md border border-gray-100">
          <h1 className="text-3xl font-extrabold mb-6 text-center text-emerald-600 tracking-tight">
            {isLogin ? "Welcome Back!" : "Create Your Account"}
          </h1>
          <p className="text-center text-gray-500 mb-6 text-sm">
            {isLogin
              ? "Login to continue exploring Taskeease."
              : "Sign up to start your mental wellness journey."}
          </p>

          {message && (
            <div className="mb-4 text-center text-sm text-red-500 font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              required
            />

            <button
              type="submit"
              className="w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600"
            >
              {isLogin ? "Login" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600"
            >
              Continue with Google
            </button>
            <button
              onClick={handleOtpLogin}
              className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600"
            >
              Login via OTP (Email Link)
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-600 font-medium hover:underline"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>

          {/* ✅ Back to Home Link */}
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-emerald-600 font-medium hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};

export default AuthPage;
