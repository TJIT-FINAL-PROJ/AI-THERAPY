import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  LogOut,
  Menu,
  X,
  Settings,
  Plus,
  MoreVertical,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  sessions,
  currentSessionId,
  setCurrentSessionId,
  handleNewConversation,
  setShowModal,
  setSessions,
}) => {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

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

  const handleDelete = async (id) => {
    try {
      // delete related messages first
      await supabase.from("messages").delete().eq("session_id", id);
      // then delete session
      await supabase.from("sessions").delete().eq("id", id);

      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleRename = async (id) => {
    if (!editTitle.trim()) return;

    try {
      await supabase
        .from("sessions")
        .update({ title: editTitle.trim() })
        .eq("id", id);

      setEditingId(null);
      setEditTitle("");
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, title: editTitle.trim() } : s
        )
      );
    } catch (err) {
      console.error("Error renaming session:", err);
    }
  };

  return (
    <>
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-16"
        } bg-gradient-to-b from-emerald-700 to-emerald-900 text-white flex flex-col justify-between transition-all duration-300`}
      >
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

          {isSidebarOpen && (
            <div className="px-2">
              <button
                onClick={handleNewConversation}
                className="w-full flex items-center gap-2 px-3 py-2 mb-3 bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                <Plus className="w-5 h-5" /> New Conversation
              </button>

              <div className="space-y-4 overflow-y-auto">
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
                            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer relative ${
                              currentSessionId === s.id
                                ? "bg-emerald-500 text-white"
                                : "hover:bg-emerald-800"
                            }`}
                            onClick={() => setCurrentSessionId(s.id)}
                          >
                            <div className="flex flex-col flex-1">
                              {editingId === s.id ? (
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRename(s.id);
                                    if (e.key === "Escape") {
                                      setEditingId(null);
                                      setEditTitle("");
                                    }
                                  }}
                                  onBlur={() => handleRename(s.id)}
                                  className="px-1 py-0.5 rounded text-black"
                                  autoFocus
                                />
                              ) : (
                                <>
                                  <span className="font-medium truncate">
                                    {s.title || "Untitled"}
                                  </span>
                                  <span className="text-xs text-gray-300">
                                    {new Date(s.created_at).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" }
                                    )}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Three Dots Menu */}
                            <div
                              className="relative ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical
                                size={18}
                                className="cursor-pointer hover:text-emerald-300"
                                onClick={() =>
                                  setMenuOpenId(
                                    menuOpenId === s.id ? null : s.id
                                  )
                                }
                              />
                              {menuOpenId === s.id && (
                                <div className="absolute left-full top-0 ml-2 bg-white text-gray-800 rounded-lg shadow-lg z-50 w-32">
                                  <button
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                    onClick={() => {
                                      setEditingId(s.id);
                                      setEditTitle(s.title || "");
                                      setMenuOpenId(null);
                                    }}
                                  >
                                    Rename
                                  </button>
                                  <button
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                                    onClick={() => {
                                      setDeleteModal(s);
                                      setMenuOpenId(null);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          <nav className="mt-6 space-y-2">
            {isSidebarOpen && (
              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-800 rounded-lg"
              >
                <Settings className="w-5 h-5" /> <span>Settings</span>
              </Link>
            )}
          </nav>
        </div>

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

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-96">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Delete chat
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              This will delete{" "}
              <span className="font-medium">
                {deleteModal.title || "Untitled"}
              </span>
              . Visit settings to delete any memory saved during this chat.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(deleteModal.id);
                  setDeleteModal(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;