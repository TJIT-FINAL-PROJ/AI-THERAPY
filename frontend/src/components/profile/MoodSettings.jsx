import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { supabase } from "../../supabaseClient";
import dayjs from "dayjs";

const moodColors = {
  Happiness: "#FFD700", // yellow
  Sadness: "#1E90FF",   // blue
  Anger: "#FF4500",     // red
  Peace: "#32CD32",     // green
  Anxiety: "#FF69B4",   // pink
  Fatigue: "#A9A9A9",   // gray
  Thoughtful: "#8A2BE2",// purple
  Love: "#FF1493",      // deep pink
  Neutral: "#D3D3D3",   // light gray
};

const moodValues = {
  Happiness: 1,
  Sadness: 2,
  Anger: 3,
  Peace: 4,
  Anxiety: 5,
  Fatigue: 6,
  Thoughtful: 7,
  Love: 8,
  Neutral: 9,
};

const MoodSettings = ({ onboarding = {}, setOnboarding }) => {
  const [userId, setUserId] = useState(null);
  const [moodData, setMoodData] = useState([]);
  const [filterDays, setFilterDays] = useState(7);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return console.error("Error getting user:", error);
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Fetch mood data
  useEffect(() => {
    if (!userId) return;
    const fetchMoodData = async () => {
      const { data, error } = await supabase
        .from("user_mood_history")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true });
      if (error) return console.error("Error fetching moods:", error);

      const mappedData = data.map((d) => ({
        date: d.date,
        day: dayjs(d.date).format("ddd (MMM D)"),
        mood: d.emotion,
      }));

      setMoodData(mappedData);
    };
    fetchMoodData();
  }, [userId]);

  // Fetch onboarding info
  useEffect(() => {
    const fetchOnboarding = async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("onboarding")
        .select("answers")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") return;

      if (data?.answers) {
        let answers = data.answers;
        if (typeof answers === "string") {
          try {
            answers = JSON.parse(answers);
          } catch (err) {
            console.error("Error parsing onboarding JSON:", err);
          }
        }
        setOnboarding({
          mood: answers?.mood || "",
          goal: answers?.goal || "",
        });
      }
    };
    fetchOnboarding();
  }, [userId]);

  // Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-700 p-2 border rounded shadow text-sm">
          {entry.mood ? `${entry.mood} – ${entry.date}` : "No data"}
        </div>
      );
    }
    return null;
  };
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Generate chart / heatmap data
  const generateChartData = () => {
    if (!userId) return [];

    const today = dayjs();
    let startDate;
    let totalDays = filterDays;

    if (filterDays === 7) {
      startDate = today.subtract(6, "day");
      totalDays = 7;
    } else if (filterDays === 14) {
      startDate = today.subtract(13, "day");
      totalDays = 14;
    } else if (filterDays === 30) {
      startDate = dayjs(`${today.year()}-10-01`);
      totalDays = 31;
    }

    const dates = Array.from({ length: totalDays }).map((_, i) =>
      startDate.add(i, "day")
    );

    return dates.map((d) => {
      const entry = moodData.find((m) => dayjs(m.date).isSame(d, "day"));
      return {
        day: d.format("ddd (MMM D)"),
        date: d.format("YYYY-MM-DD"),
        mood: entry?.mood || null,
        value: entry ? moodValues[entry.mood] || 1 : 1,
      };
    });
  };

  const chartData = generateChartData();
  const lastMoodEntry = chartData[chartData.length - 1];
  const moodCounts = {};
  chartData.forEach((d) => {
    if (d.mood) moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
  });
  const mostFrequentMood = Object.keys(moodCounts).reduce(
    (a, b) => (moodCounts[a] > moodCounts[b] ? a : b),
    null
  );

  return (
    <div className="space-y-6 text-sm text-gray-900 dark:text-gray-50 transition-colors duration-300">
      {/* Header */}
      <motion.h3
        className="text-xl font-semibold text-pink-700 dark:text-pink-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Mood Snapshot
      </motion.h3>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {["Last Mood", "Most Frequent", "Total Sessions"].map((title, idx) => {
          const value =
            title === "Last Mood"
              ? lastMoodEntry?.mood || "N/A"
              : title === "Most Frequent"
              ? mostFrequentMood || "N/A"
              : chartData.filter((d) => d.mood).length;

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
{/* Mood Trend */}
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, delay: 0.2 }}
>
  <h4 className="font-semibold mt-6">Mood Trend</h4>

  {chartData.length ? (
    filterDays === 30 ? (
      // Heatmap for 30 days
      <div className="mt-2">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 text-xs text-gray-600 dark:text-gray-300 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {chartData.map((entry, idx) => {
            // Adjust neutral color based on theme
            const isDark = document.documentElement.classList.contains("dark");
            const neutralColor = isDark ? "#374151" : "#e5e7eb"; // dark gray vs light gray

            return (
              <div
                key={idx}
                onMouseEnter={(e) => {
                  setHoveredCell(entry);
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredCell(null)}
                className="flex items-center justify-center text-xs font-medium rounded-md transition-colors duration-300"
                style={{
                  backgroundColor: entry.mood
                    ? moodColors[entry.mood] || "#f43f5e"
                    : neutralColor,
                  color: isDark ? "#f9fafb" : "#1f2937", // readable text
                  height: "40px",
                  minWidth: "50px",
                }}
              >
                {dayjs(entry.date).date()}
              </div>
            );
          })}
        </div>
      </div>
    ) : (
      // Bar chart for 7 & 14 days
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={chartData}>
          <XAxis
            dataKey="day"
            tick={{
              fill: document.documentElement.classList.contains("dark")
                ? "#f9fafb" // white text in dark mode
                : "#1f2937", // dark gray text in light mode
              fontSize: 12,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.mood ? moodColors[entry.mood] || "#f43f5e" : "#e5e7eb"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  ) : (
    <p className="text-gray-500 dark:text-gray-300 mt-2">
      No mood data available.
    </p>
  )}

  {hoveredCell && (
    <div
      className="fixed z-50 p-2 text-sm bg-white dark:bg-gray-700 border rounded shadow"
      style={{
        top: tooltipPos.y + 10,
        left: tooltipPos.x + 10,
        pointerEvents: "none",
      }}
    >
      {hoveredCell.mood
        ? `${hoveredCell.day}: ${hoveredCell.mood}`
        : `${hoveredCell.day}: No data`}
    </div>
  )}

  {/* Filter buttons */}
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


      {/* Initial Mood & Goal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h4 className="font-semibold mt-6 text-pink-700 dark:text-pink-400">
          Initial Mood & Goal
        </h4>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <label className="font-medium">Mood</label>
            <p className="border p-2 rounded border-pink-400 dark:border-pink-300 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50">
              {onboarding?.mood || "N/A"}
            </p>
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Goal</label>
            <p className="border p-2 rounded border-pink-400 dark:border-pink-300 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50">
              {onboarding?.goal || "N/A"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MoodSettings;
