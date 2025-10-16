import React from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const MoodSettings = ({ moodData }) => (
  <div className="space-y-6 text-sm text-gray-700">
    <h3 className="text-xl font-semibold text-pink-700">Mood Snapshot</h3>

    <div className="grid grid-cols-3 gap-4">
      <div className="bg-pink-50 p-4 rounded-xl text-center">
        <p className="text-lg">😊</p>
        <p className="font-semibold">Last Mood</p>
        <p className="text-xs text-gray-500">Today</p>
      </div>
      <div className="bg-pink-50 p-4 rounded-xl text-center">
        <p className="text-lg">❤️</p>
        <p className="font-semibold">Most Frequent</p>
        <p className="text-xs text-gray-500">Happiness</p>
      </div>
      <div className="bg-pink-50 p-4 rounded-xl text-center">
        <p className="text-lg">🗓️</p>
        <p className="font-semibold">Total Sessions</p>
        <p className="text-xs text-gray-500">23</p>
      </div>
    </div>

    <h4 className="font-semibold mt-6">Mood Trend</h4>
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={moodData}>
        <XAxis dataKey="day" />
        <Tooltip />
        <Bar dataKey="mood" fill="#f43f5e" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default MoodSettings;
