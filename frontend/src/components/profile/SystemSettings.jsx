import React from "react";
import { motion } from "framer-motion";

const SystemSettings = ({ preferences, setPreferences }) => {
  return (
    <div className="space-y-6 text-sm text-gray-700">
      <h3 className="text-xl font-semibold text-pink-700">Preferences</h3>

      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Tone */}
        <div>
          <label className="font-medium">Tone</label>
          <select
            value={preferences.tone}
            onChange={(e) => setPreferences({ ...preferences, tone: e.target.value })}
            className="w-full border rounded p-2"
          >
            <option>Calm</option>
            <option>Motivational</option>
            <option>Empathetic</option>
            <option>Neutral</option>
          </select>
        </div>

        {/* Default Mode */}
        <div>
          <label className="font-medium">Default Mode</label>
          <select
            value={preferences.defaultMode}
            onChange={(e) =>
              setPreferences({ ...preferences, defaultMode: e.target.value })
            }
            className="w-full border rounded p-2"
          >
            <option>Conversation</option>
            <option>Voice-only</option>
          </select>
        </div>

        {/* Session Length */}
        <div>
          <label className="font-medium">Session Length</label>
          <select
            value={preferences.sessionLength || "No limit"}
            onChange={(e) =>
              setPreferences({ ...preferences, sessionLength: e.target.value })
            }
            className="w-full border rounded p-2"
          >
            <option>No limit</option>
            <option>30 min</option>
            <option>Custom</option>
          </select>
        </div>

        {/* Theme */}
        <div>
          <label className="font-medium">Theme</label>
          <select
            value={preferences.theme || "Light"}
            onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
            className="w-full border rounded p-2"
          >
            <option>Light</option>
            <option>Dark</option>
          </select>
        </div>
      </motion.div>

      {/* Auto-Greet */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <input
          type="checkbox"
          checked={preferences.autoGreet}
          onChange={(e) =>
            setPreferences({ ...preferences, autoGreet: e.target.checked })
          }
        />
        <span>Auto-greet on session start</span>
      </motion.div>

      {/* Notifications */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <input
          type="checkbox"
          checked={preferences.notifications}
          onChange={(e) =>
            setPreferences({ ...preferences, notifications: e.target.checked })
          }
        />
        <span>Enable daily check-in & reminders</span>
      </motion.div>

      {/* Voice Settings */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <label className="font-medium">Voice</label>
          <select
            value={preferences.voice || "Female"}
            onChange={(e) =>
              setPreferences({ ...preferences, voice: e.target.value })
            }
            className="w-full border rounded p-2"
          >
            <option>Female</option>
            <option>Male</option>
          </select>
        </div>

        <div>
          <label className="font-medium">Playback Speed</label>
          <select
            value={preferences.playbackSpeed || 1.0}
            onChange={(e) =>
              setPreferences({ ...preferences, playbackSpeed: parseFloat(e.target.value) })
            }
            className="w-full border rounded p-2"
          >
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
          </select>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            checked={preferences.autoplayReply}
            onChange={(e) =>
              setPreferences({ ...preferences, autoplayReply: e.target.checked })
            }
          />
          <span>Autoplay reply</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SystemSettings;
