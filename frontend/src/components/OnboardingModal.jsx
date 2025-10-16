import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../contexts/ThemeContext";

const OnboardingModal = ({ onComplete }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [mood, setMood] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOnboarding = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) return;

        const { data, error } = await supabase
          .from("onboarding")
          .select("answers")
          .eq("user_id", user.id)
          .single();

        if (error) return;

        if (data?.answers) {
          setMood(data.answers.mood || "");
          setGoal(data.answers.goal || "");
        }
      } catch (err) {
        console.error("Error fetching onboarding:", err.message);
      }
    };

    fetchOnboarding();
  }, []);

  const handleSave = async () => {
    if (!mood || !goal) {
      toast.error("Please fill in both Mood and Goal ✍️");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("User not found.");

      const { error: metaError } = await supabase.auth.updateUser({
        data: { mood, goal },
      });
      if (metaError) throw metaError;

      const { error: dbError } = await supabase.from("onboarding").upsert(
        {
          user_id: user.id,
          answers: { mood, goal },
        },
        { onConflict: "user_id" }
      );
      if (dbError) throw dbError;

      toast.success(`Saved! 🎉 Mood: ${mood}, Goal: ${goal}`);
      setTimeout(() => onComplete?.(), 1000);
    } catch (err) {
      console.error("Save error:", err.message);
      toast.error("Failed to save. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`rounded-xl p-6 w-[90%] max-w-md shadow-xl transition-colors duration-300 ${
          isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"
        }`}
      >
        <h2
          className={`text-xl font-bold mb-4 ${
            isDarkMode ? "text-pink-400" : "text-pink-700"
          }`}
        >
          Quick Setup
        </h2>
        <p className={`mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Just a few quick questions to personalize your chat experience:
        </p>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="How’s your current mood?"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
            }`}
          />
          <input
            type="text"
            placeholder="What’s your main goal with therapy?"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
            }`}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`mt-5 w-full py-2 rounded-lg font-semibold transition-colors duration-300 ${
            isDarkMode
              ? "bg-pink-400 hover:bg-pink-500 text-gray-900"
              : "bg-pink-600 hover:bg-pink-700 text-white"
          } disabled:opacity-50`}
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </div>

      <ToastContainer position="bottom-right" autoClose={2500} />
    </div>
  );
};

export default OnboardingModal;
