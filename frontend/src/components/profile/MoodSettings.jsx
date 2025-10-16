import React, { useState } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";

const moodColors = {
  1: "#ef4444", // Sad → Red
  2: "#facc15", // Neutral → Yellow
  3: "#22c55e", // Happy → Green
  4: "#3b82f6", // Excited → Blue
  5: "#a78bfa", // Relaxed → Purple
};

const moodNames = {
  1: "Sad",
  2: "Neutral",
  3: "Happy",
  4: "Excited",
  5: "Relaxed",
};

const MoodSettings = ({ moodData = [], onboarding = {}, setOnboarding }) => {
  const [filterDays, setFilterDays] = useState(7); // last 7/14/30 days filter

  const filteredMoodData = Array.isArray(moodData) ? moodData.slice(-filterDays) : [];

  const lastMoodEntry = filteredMoodData[filteredMoodData.length - 1];

  // Calculate most frequent mood safely
  const mostFrequentMood = (() => {
    if (!filteredMoodData.length) return null;
    const counts = {};
    filteredMoodData.forEach((d) => {
      if (d && d.mood) counts[d.mood] = (counts[d.mood] || 0) + 1;
    });
    const maxMood = Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
    return maxMood;
  })();

  return (
    <div className="space-y-6 text-sm text-gray-700">
      {/* Mood Snapshot */}
      <motion.h3
        className="text-xl font-semibold text-pink-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Mood Snapshot
      </motion.h3>

      <motion.div
        className="grid grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="bg-pink-50 p-4 rounded-xl text-center">
          <p className="text-lg">😊</p>
          <p className="font-semibold">Last Mood</p>
          <p className="text-xs text-gray-500">
            {lastMoodEntry ? moodNames[lastMoodEntry.mood] : "N/A"}
          </p>
        </div>

        <div className="bg-pink-50 p-4 rounded-xl text-center">
          <p className="text-lg">❤️</p>
          <p className="font-semibold">Most Frequent</p>
          <p className="text-xs text-gray-500">
            {mostFrequentMood ? moodNames[mostFrequentMood] : "N/A"}
          </p>
        </div>

        <div className="bg-pink-50 p-4 rounded-xl text-center">
          <p className="text-lg">🗓️</p>
          <p className="font-semibold">Total Sessions</p>
          <p className="text-xs text-gray-500">{filteredMoodData.length}</p>
        </div>
      </motion.div>

      {/* Mood Trend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h4 className="font-semibold mt-6">Mood Trend</h4>
        {filteredMoodData.length ? (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={filteredMoodData}>
              <XAxis dataKey="day" />
              <Tooltip
                formatter={(value) => moodNames[value] || "N/A"}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length) {
                    const date = payload[0].payload.date || label;
                    return `Date: ${date}`;
                  }
                  return label;
                }}
              />
              <Bar dataKey="mood" radius={[8, 8, 0, 0]}>
                {filteredMoodData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={moodColors[entry.mood] || "#f43f5e"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 mt-2">No mood data available.</p>
        )}

        {/* Filter Days */}
        <div className="mt-2 flex gap-2 text-xs">
          {[7, 14, 30].map((days) => (
            <motion.button
              key={days}
              onClick={() => setFilterDays(days)}
              className={`px-2 py-1 rounded ${
                filterDays === days
                  ? "bg-pink-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              whileHover={{ scale: 1.05 }}
            >
              Last {days} days
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Mood + Goal (moved from Bio) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h4 className="font-semibold mt-6 text-pink-700">Current Mood & Goal</h4>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <label className="font-medium">Mood</label>
            <input
              type="text"
              value={onboarding?.mood || ""}
              onChange={(e) =>
                setOnboarding({ ...onboarding, mood: e.target.value })
              }
              className="border p-2 rounded border-pink-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Goal</label>
            <input
              type="text"
              value={onboarding?.goal || ""}
              onChange={(e) =>
                setOnboarding({ ...onboarding, goal: e.target.value })
              }
              className="border p-2 rounded border-pink-400"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MoodSettings;
