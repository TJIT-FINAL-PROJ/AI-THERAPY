// src/pages/AuthPage.jsx
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
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (mode === "signup") setIsLogin(false);
    else setIsLogin(true);

    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUser(data.user);
        await fetchProfile(data.user.id);
      }
    };
    checkSession();
  }, [mode]);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!error) setProfile(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return setMessage(error.message);
        setCurrentUser(data.user);
        await fetchProfile(data.user.id);
        if (!profile?.mood || !profile?.goal) setShowOnboarding(true);
        else navigate("/chat");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) return setMessage(error.message);
        if (data.user) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (loginError) return setMessage(loginError.message);
          setCurrentUser(loginData.user);
          await fetchProfile(loginData.user.id);
          if (!profile?.mood || !profile?.goal) setShowOnboarding(true);
          else navigate("/chat");
        }
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { queryParams: { prompt: "consent" } },
      });
      if (error) setMessage(error.message);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleOtpLogin = async () => {
    if (!email) return alert("Please enter your email first");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage(error.message);
    else {
      setOtpSent(true);
      setMessage("📩 OTP has been sent to your email. Please check!");
    }
  };

  const handleOtpVerify = async () => {
    if (!otpCode) return alert("Enter the OTP you received in email");
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "email" });
    if (error) setMessage(error.message);
    else {
      setCurrentUser(data.user);
      await fetchProfile(data.user.id);
      if (!profile?.mood || !profile?.goal) setShowOnboarding(true);
      else navigate("/chat");
    }
  };

  const handleLogout = async () => {
    if (window.confirm(`Are you sure you want to log out, ${profile?.full_name || currentUser?.email || "User"}?`)) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setProfile(null);
      navigate("/");
    }
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-pink-50 via-rose-100 to-peach-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {showOnboarding && <OnboardingModal onComplete={() => navigate("/chat")} />}
      {!showOnboarding && (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 w-[90%] max-w-md border border-gray-100 dark:border-gray-700 transition-colors duration-300">
          {currentUser ? (
            <div className="text-center space-y-6">
              <h1 className="text-2xl font-bold text-pink-700 dark:text-pink-400">
                Hello, {profile?.full_name || "User"} 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-300">{currentUser.email}</p>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold mb-6 text-center text-pink-700 dark:text-pink-400 tracking-tight">
                {isLogin ? "Welcome Back!" : "Create Your Account"}
              </h1>
              <p className="text-center text-gray-500 dark:text-gray-300 mb-6 text-sm">
                {isLogin
                  ? "Login to continue exploring Taskeease."
                  : "Sign up to start your mental wellness journey."}
              </p>

              {message && (
                <div className="mb-4 text-center text-sm text-red-500 font-medium">{message}</div>
              )}

              {!otpSent && (
                <>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                        required
                      />
                    )}
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-pink-600 dark:bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 dark:hover:bg-pink-400 transition-colors"
                    >
                      {isLogin ? "Login" : "Sign Up"}
                    </button>
                  </form>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full bg-rose-500 text-white py-2 rounded-lg font-medium hover:bg-rose-600"
                    >
                      Continue with Google
                    </button>
                    <button
                      onClick={handleOtpLogin}
                      className="w-full bg-pink-100 dark:bg-gray-700 text-pink-700 dark:text-pink-400 py-2 rounded-lg font-medium hover:bg-pink-200 dark:hover:bg-gray-600"
                    >
                      Login via OTP
                    </button>
                  </div>
                </>
              )}

              {otpSent && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                  />
                  <button
                    onClick={handleOtpVerify}
                    className="w-full bg-pink-600 dark:bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 dark:hover:bg-pink-400"
                  >
                    Verify OTP
                  </button>
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    ← Back
                  </button>
                </div>
              )}

              <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
                {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-pink-700 dark:text-pink-400 font-medium hover:underline"
                >
                  {isLogin ? "Sign Up" : "Login"}
                </button>
              </p>

              <div className="mt-4 text-center">
                <Link to="/" className="text-pink-700 dark:text-pink-400 font-medium hover:underline">
                  ← Back to Home
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default AuthPage;
