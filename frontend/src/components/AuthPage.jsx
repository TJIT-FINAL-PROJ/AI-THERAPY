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

  // ✅ Fetch profile from profiles table
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error) setProfile(data);
  };

  // ✅ Login/Signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (isLogin) {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return setMessage(error.message);

        setCurrentUser(data.user);
        await fetchProfile(data.user.id);

        if (!profile?.mood || !profile?.goal) {
          setShowOnboarding(true);
        } else {
          navigate("/chat");
        }
      } else {
        // SIGNUP
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }, // goes into auth metadata first
          },
        });
        if (error) return setMessage(error.message);

        if (data.user) {
          // ✅ Immediately log them in
          const { data: loginData, error: loginError } =
            await supabase.auth.signInWithPassword({
              email,
              password,
            });

          if (loginError) return setMessage(loginError.message);

          setCurrentUser(loginData.user);
          await fetchProfile(loginData.user.id);

          if (!profile?.mood || !profile?.goal) {
            setShowOnboarding(true);
          } else {
            navigate("/chat");
          }
        }
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  // ✅ Google login
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

  // ✅ OTP login
  const handleOtpLogin = async () => {
    if (!email) return alert("Please enter your email first");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage(error.message);
    else {
      setOtpSent(true);
      setMessage("📩 OTP has been sent to your email. Please check!");
    }
  };

  // ✅ Verify OTP
  const handleOtpVerify = async () => {
    if (!otpCode) return alert("Enter the OTP you received in email");
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "email",
    });
    if (error) setMessage(error.message);
    else {
      setCurrentUser(data.user);
      await fetchProfile(data.user.id);
      if (!profile?.mood || !profile?.goal) {
        setShowOnboarding(true);
      } else {
        navigate("/chat");
      }
    }
  };

  const handleLogout = async () => {
    if (
      window.confirm(
        `Are you sure you want to log out, ${
          profile?.full_name || currentUser?.email || "User"
        }?`
      )
    ) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setProfile(null);
      navigate("/");
    }
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-50 via-white to-green-100">
      {showOnboarding && <OnboardingModal onComplete={() => navigate("/chat")} />}
      {!showOnboarding && (
        <div className="bg-white shadow-xl rounded-2xl p-8 w-[90%] max-w-md border border-gray-100">
          {currentUser ? (
            <div className="text-center space-y-6">
              <h1 className="text-2xl font-bold text-emerald-600">
                Hello, {profile?.full_name || "User"} 👋
              </h1>
              <p className="text-gray-600">{currentUser.email}</p>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
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

              {!otpSent && (
                <>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={handleOtpVerify}
                    className="w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600"
                  >
                    Verify OTP
                  </button>
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-400"
                  >
                    ← Back
                  </button>
                </div>
              )}

              <p className="mt-6 text-center text-sm text-gray-600">
                {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-emerald-600 font-medium hover:underline"
                >
                  {isLogin ? "Sign Up" : "Login"}
                </button>
              </p>

              <div className="mt-4 text-center">
                <Link
                  to="/"
                  className="text-emerald-600 font-medium hover:underline"
                >
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
