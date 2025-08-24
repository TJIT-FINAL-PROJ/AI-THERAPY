import React from "react";
import { Link } from "react-router-dom";
import { User, LogOut, Menu, X, Settings, Plus, Trash2 } from "lucide-react";

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  sessions,
  currentSessionId,
  setCurrentSessionId,
  handleNewConversation,
  setShowModal,
}) => {
  // Group sessions by Today / Yesterday / Older
  const groupSessions = (sessions) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = { Today: [], Yesterday: [], Older: [] };

    sessions.forEach((s) => {
      const date = new Date(s.created_at);
      if (date.toDateString() === today.toDateString()) {
        groups.Today.push(s);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(s);
      } else {
        groups.Older.push(s);
      }
    });

    return groups;
  };

  return (
    <aside
      className={`${
        isSidebarOpen ? "w-64" : "w-16"
      } bg-gradient-to-b from-emerald-700 to-emerald-900 text-white flex flex-col justify-between transition-all duration-300`}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between p-4">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold transition-opacity duration-300">
              Therapy Chat
            </h1>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg hover:bg-emerald-800"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* New Conversation */}
        {isSidebarOpen && (
          <div className="px-2">
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center gap-2 px-3 py-2 mb-3 bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              <Plus className="w-5 h-5" /> New Conversation
            </button>

            {/* Sessions */}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {Object.entries(groupSessions(sessions)).map(([label, items]) =>
                items.length > 0 ? (
                  <div key={label}>
                    <h3 className="text-sm font-semibold text-gray-300 px-2 mb-1">
                      {label}
                    </h3>

                    <div className="space-y-1">
                      {items.map((s) => (
  <div
    key={s.id}
    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${
      currentSessionId === s.id
        ? "bg-emerald-500 text-white"
        : "hover:bg-emerald-800"
    }`}
    onClick={() => setCurrentSessionId(s.id)}
  >
    {/* LEFT: Title + Time */}
    <div className="flex flex-col">
      <span className="font-medium">
        {s.title || "Untitled"}   {/* <-- Show session title */}
      </span>
      <span className="text-xs text-gray-300">
        {new Date(s.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>

    {/* RIGHT: Delete button */}
    <Trash2
      size={16}
      className="ml-2 hover:text-red-400"
      onClick={(e) => {
        e.stopPropagation();
        // TODO: deleteSession(s.id)
      }}
    />
  </div>
))}

                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Links */}
        <nav className="mt-6 space-y-2">
          {isSidebarOpen && (
            <Link
              to="/settings"
              className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-800 rounded-lg"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Bottom */}
      <div className="mb-4 space-y-2">
        <Link
          to="/profile"
          className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-800 rounded-lg"
        >
          <User className="w-5 h-5" />
          {isSidebarOpen && <span>Profile</span>}
        </Link>
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-600 rounded-lg text-left"
        >
          <LogOut className="w-5 h-5" />
          {isSidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
