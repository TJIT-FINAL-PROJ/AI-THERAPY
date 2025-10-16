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
    <div className="space-y-6 text-sm text-gray-900 dark:text-gray-50 transition-colors duration-300">
      {/* Mood Snapshot */}
      <motion.h3
        className="text-xl font-semibold text-pink-700 dark:text-pink-400"
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
        {["Last Mood", "Most Frequent", "Total Sessions"].map((title, idx) => {
          const value =
            title === "Last Mood"
              ? lastMoodEntry
                ? moodNames[lastMoodEntry.mood]
                : "N/A"
              : title === "Most Frequent"
              ? mostFrequentMood
                ? moodNames[mostFrequentMood]
                : "N/A"
              : filteredMoodData.length;

          return (
            <div
              key={idx}
              className="bg-pink-50 dark:bg-gray-700 p-4 rounded-xl text-center transition-colors duration-300"
            >
              <p className="text-lg">
                {title === "Last Mood"
                  ? "😊"
                  : title === "Most Frequent"
                  ? "❤️"
                  : "🗓️"}
              </p>
              <p className="font-semibold">{title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-300">{value}</p>
            </div>
          );
        })}
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
              <XAxis
                dataKey="day"
                tick={{ fill: "#1f2937" }}
                className="dark:text-gray-50"
              />
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
          <p className="text-gray-500 dark:text-gray-300 mt-2">
            No mood data available.
          </p>
        )}

        {/* Filter Days */}
        <div className="mt-2 flex gap-2 text-xs">
          {[7, 14, 30].map((days) => (
            <motion.button
              key={days}
              onClick={() => setFilterDays(days)}
              className={`px-2 py-1 rounded transition-colors duration-300 ${
                filterDays === days
                  ? "bg-pink-600 text-white"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-50"
              }`}
              whileHover={{ scale: 1.05 }}
            >
              Last {days} days
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Current Mood & Goal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h4 className="font-semibold mt-6 text-pink-700 dark:text-pink-400">
          Current Mood & Goal
        </h4>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {["mood", "goal"].map((field) => (
            <div key={field} className="flex flex-col">
              <label className="font-medium">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type="text"
                value={onboarding?.[field] || ""}
                onChange={(e) =>
                  setOnboarding({ ...onboarding, [field]: e.target.value })
                }
                className="border p-2 rounded border-pink-400 dark:border-pink-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 transition-colors duration-300"
              />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default MoodSettings;
