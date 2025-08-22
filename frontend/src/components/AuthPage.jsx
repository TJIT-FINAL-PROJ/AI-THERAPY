import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

const AuthPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode"); // "login" or "signup"

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");

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
          if (error.message.includes("Invalid login credentials")) {
            // Try to check if user exists (via signUp attempt with dummy pw)
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password: "temporary_password_check123!",
            });

            if (signUpError?.message.includes("already registered")) {
              setMessage("❌ Incorrect password. Please try again.");
            } else {
              setMessage("❌ Account not found. Please sign up.");
            }
          } else {
            setMessage(error.message);
          }
          return;
        }

        setMessage("✅ Login successful!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            setMessage("⚠️ Account already exists. Please log in.");
          } else {
            setMessage(error.message);
          }
          return;
        }

        setMessage("✅ Signup successful! Please check your email to confirm.");
      }
    } catch (err) {
      console.error("Auth error:", err.message);
      setMessage(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setMessage(error.message);
  };

  const handleOtpLogin = async () => {
    if (!email) {
      alert("Please enter your email first");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage(error.message);
    else alert("📩 Check your email for a login link!");
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-50 via-white to-green-100">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
            required
          />

          <button
            type="submit"
            className="w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 shadow-md hover:shadow-lg transition"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition"
          >
            Continue with Google
          </button>
          <button
            onClick={handleOtpLogin}
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition"
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

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-emerald-600 transition"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
