import React from "react";

const SystemSettings = ({ preferences, setPreferences }) => (
  <div className="space-y-6 text-sm text-gray-700">
    <h3 className="text-xl font-semibold text-pink-700">Preferences</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label>Tone</label>
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
      <div>
        <label>Default Mode</label>
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
    </div>

    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={preferences.autoGreet}
        onChange={(e) =>
          setPreferences({ ...preferences, autoGreet: e.target.checked })
        }
      />
      <span>Auto-greet on session start</span>
    </div>
  </div>
);

export default SystemSettings;
