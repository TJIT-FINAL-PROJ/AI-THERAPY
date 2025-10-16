import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OnboardingModal = ({ onComplete }) => {
  const [mood, setMood] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Fetch saved onboarding data on mount (pre-fill)
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

        if (error) return; // no onboarding yet

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

      // ✅ Update user metadata (optional but nice)
      const { error: metaError } = await supabase.auth.updateUser({
        data: { mood, goal },
      });
      if (metaError) throw metaError;

      // ✅ Save onboarding JSON
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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-pink-700">Quick Setup</h2>
        <p className="mb-4 text-gray-600">
          Just a few quick questions to personalize your chat experience:
        </p>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="How’s your current mood?"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="What’s your main goal with therapy?"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-5 w-full bg-pink-600 text-white py-2 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </div>

      <ToastContainer position="bottom-right" autoClose={2500} />
    </div>
  );
};

export default OnboardingModal;
