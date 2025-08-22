import React, { useState } from "react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      console.log("Logging in...");
      // Call login API
    } else {
      console.log("Signing up...");
      // Call signup API
    }
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-[90%] max-w-md border border-gray-100">
        {/* Heading */}
        <h1 className="text-3xl font-extrabold mb-6 text-center text-emerald-600 tracking-tight">
          {isLogin ? "Welcome Back!" : "Create Your Account"}
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          {isLogin
            ? "Login to continue exploring Taskeease."
            : "Sign up to start your mental wellness journey."}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
            required
          />
          <input
            type="password"
            placeholder="Password"
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

        {/* Switch Mode */}
        <p className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-emerald-600 font-medium hover:underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>

        {/* Back to Home */}
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
