import React, { useState } from "react";
import { motion } from "framer-motion";

const SecurityAccount = ({ profile }) => {
  const [emailVerified] = useState(false); // Example state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  // Dummy session data (replace with real data if available)
  const sessions = [
    { device: "Chrome on Windows", date: "2025-10-16 10:00", ip: "192.168.1.1" },
    { device: "Firefox on Mac", date: "2025-10-15 14:30", ip: "192.168.1.5" },
  ];

  const handleResendEmail = () => {
    alert("Verification email sent!");
  };

  const handleLogoutAll = () => {
    alert("Logged out from all devices!");
  };

  return (
    <div className="space-y-4 text-sm text-gray-900 dark:text-gray-50 transition-colors duration-300">
      <motion.h3
        className="text-xl font-semibold text-pink-700 dark:text-pink-400"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Account Security
      </motion.h3>

      {/* Email Verification */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <p>
          <span className="font-medium text-gray-800 dark:text-gray-200">Email:</span>{" "}
          {profile.email}{" "}
          {emailVerified ? (
            <span className="text-green-600 font-medium ml-2">(Verified)</span>
          ) : (
            <span className="text-red-600 font-medium ml-2">(Not Verified)</span>
          )}
        </p>

        {!emailVerified && (
          <button
            onClick={handleResendEmail}
            className="mt-1 text-xs text-pink-600 dark:text-pink-400 hover:underline"
          >
            Resend verification email
          </button>
        )}
      </motion.div>

      {/* 2FA Toggle */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <input
          type="checkbox"
          checked={twoFAEnabled}
          onChange={(e) => setTwoFAEnabled(e.target.checked)}
          className="accent-pink-500"
        />
        <span>Enable 2FA / OTP</span>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex flex-col gap-2 mt-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex flex-wrap gap-4">
          <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors duration-300">
            Change Password
          </button>

          <button className="border border-red-500 text-red-600 dark:text-red-400 dark:border-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-300">
            Delete Account
          </button>

          <button
            onClick={handleLogoutAll}
            className="border border-gray-400 text-gray-700 dark:border-gray-500 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
          >
            Logout All Devices
          </button>
        </div>

        {/* Session Activity */}
        <button
          onClick={() => setShowSessions(!showSessions)}
          className="mt-2 text-xs text-pink-600 dark:text-pink-400 hover:underline"
        >
          {showSessions ? "Hide" : "Show"} Recent Sessions
        </button>

        {showSessions && (
          <div className="mt-2 border rounded p-2 bg-gray-50 dark:bg-gray-800 text-xs transition-colors duration-300">
            {sessions.map((s, idx) => (
              <div
                key={idx}
                className="flex justify-between border-b last:border-b-0 py-1 border-gray-200 dark:border-gray-600"
              >
                <span>{s.device}</span>
                <span>{s.date}</span>
                <span>{s.ip}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SecurityAccount;
