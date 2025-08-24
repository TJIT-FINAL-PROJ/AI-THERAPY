import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const OnboardingModal = ({ onComplete }) => {
  const [mood, setMood] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!mood || !goal) return alert("Please fill both fields ✍️");
    setLoading(true);

    // ✅ Step 1: update metadata (your existing logic)
    const { data: updatedUser, error } = await supabase.auth.updateUser({
      data: { mood, goal },
    });

    if (error) {
      console.error("Error updating metadata:", error.message);
      alert("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    // ✅ Step 2: also insert into onboarding table
    try {
      const userId = updatedUser?.user?.id; // get user ID
      if (!userId) throw new Error("User not found after update");

      const { error: insertError } = await supabase
        .from("onboarding")
        .upsert(
          {
            user_id: userId,
            answers: { mood, goal }, // keep JSON format
          },
          { onConflict: "user_id" } // makes sure 1 row per user
        );

      if (insertError) throw insertError;
    } catch (err) {
      console.error("Error saving onboarding:", err.message);
      alert("Something went wrong while saving onboarding.");
      setLoading(false);
      return;
    }

    setLoading(false);

    // ✅ tell parent that onboarding is complete
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-emerald-600">Quick Setup</h2>
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
          className="mt-5 w-full bg-emerald-500 text-white py-2 rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
};

export default OnboardingModal;
