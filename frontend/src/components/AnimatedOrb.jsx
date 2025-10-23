// AnimatedOrb.jsx
import React from "react";

const AnimatedOrb = ({ active = false }) => {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div
        className={`absolute w-full h-full rounded-full ${
          active ? "bg-pink-300 opacity-50 animate-ping" : "bg-pink-200 opacity-30"
        }`}
      ></div>
      <div
        className={`relative w-6 h-6 rounded-full bg-pink-500 transition-all duration-300 ${
          active ? "scale-125" : "scale-100"
        }`}
      ></div>
    </div>
  );
};

export default AnimatedOrb;
