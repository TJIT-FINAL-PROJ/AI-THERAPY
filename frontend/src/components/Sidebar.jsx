import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  LogOut,
  Menu,
  X,
  Settings,
  Plus,
  MoreVertical,
  Mail,
  Mic,
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
  user,
  voiceModeOn,        // new prop
  setVoiceModeOn,     // function to toggle
}) => {
  const navigate = useNavigate();
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const dropdownRef = useRef(null);

  // Live avatar refresh
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchAvatar();
    const interval = setInterval(fetchAvatar, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const groupSessions = (sessions) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const groups = { Today: [], Yesterday: [], Older: [] };
    sessions.forEach((s) => {
      const d = new Date(s.created_at);
      if (d.toDateString() === today.toDateString()) groups.Today.push(s);
      else if (d.toDateString() === yesterday.toDateString())
        groups.Yesterday.push(s);
      else groups.Older.push(s);
    });
    return groups;
  };

  const handleDelete = async (id) => {
    try {
      await supabase.from("messages").delete().eq("session_id", id);
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
        prev.map((s) => (s.id === id ? { ...s, title: editTitle.trim() } : s))
      );
    } catch (err) {
      console.error("Error renaming session:", err);
    }
  };

  const handleVoiceModeToggle = () => {
    setVoiceModeOn((prev) => !prev);  // toggle state
    navigate("/voice-therapy");        // go to voice therapy page
  };

  return (
    <>
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-pink-500 via-pink-500 to-rose-400 text-white flex flex-col justify-between transition-all duration-300`}
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
              className="rounded-lg hover:bg-pink-700 p-1.5 transition"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {isSidebarOpen && (
            <div className="px-2">
              <button
                onClick={handleNewConversation}
                className="w-full flex items-center gap-2 px-3 py-2 mb-3 bg-pink-400 hover:bg-pink-300 rounded-lg transition-all duration-200"
              >
                <Plus className="w-5 h-5" /> New Conversation
              </button>

              {/* ✅ Voice Therapy Toggle Button */}
              <button
                onClick={handleVoiceModeToggle}
                className={`w-full flex items-center gap-2 px-3 py-2 mb-3 ${
                  voiceModeOn
                    ? "bg-pink-700"
                    : "bg-pink-500 hover:bg-pink-400"
                } rounded-lg transition-all duration-200`}
              >
                <Mic className="w-5 h-5" />
                {isSidebarOpen && "Voice Therapy Mode"}
              </button>

              <div className="space-y-4 overflow-y-auto">
                {Object.entries(groupSessions(sessions)).map(([label, items]) =>
                  items.length > 0 ? (
                    <div key={label}>
                      <h3 className="text-sm font-semibold text-pink-200 px-2 mb-1">
                        {label}
                      </h3>
                      <div className="space-y-1 relative">
                        {items.map((s) => (
                          <div
                            key={s.id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer relative transition-all duration-200 ${
                              currentSessionId === s.id
                                ? "bg-pink-600 text-white shadow-md"
                                : "hover:bg-pink-600"
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
                                  <span className="text-xs text-pink-200">
                                    {new Date(s.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="relative ml-2">
                              <MoreVertical
                                size={18}
                                className="cursor-pointer hover:text-pink-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(menuOpenId === s.id ? null : s.id);
                                }}
                              />
                              {menuOpenId === s.id && (
                                <div className="fixed z-50 bg-white text-gray-800 rounded-lg shadow-lg w-32 p-1 border border-gray-200">
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
        </div>

        {/* User Dropdown */}
        <div className="relative mb-4 px-4" ref={dropdownRef}>
          <button
            className={`flex items-center justify-center ${
              isSidebarOpen ? "gap-3 px-3 py-2" : "p-2"
            } w-full rounded-2xl hover:bg-pink-700 transition-all duration-200`}
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            {avatarUrl && (
              <div
                className={`flex items-center justify-center rounded-2xl overflow-hidden transition-all duration-300 ${
                  isSidebarOpen ? "w-10 h-10" : "w-12 h-12"
                }`}
              >
                <img src={avatarUrl} className="w-full h-full rounded-2xl" />
              </div>
            )}
            {isSidebarOpen && (
              <span className="text-sm font-medium truncate">{user?.full_name}</span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute bottom-12 left-0 w-75 bg-pink-100 text-gray-800 rounded-lg shadow-lg border border-pink-400 z-50 divide-y">
              <div className="flex items-center gap-2 px-4 py-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="truncate max-w-[180px]" title={user?.email}>
                  {user?.email || "No email"}
                </span>
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
              >
                <User className="w-4 h-4 text-gray-600" />
                Profile
              </Link>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-96">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to delete this conversation?
            </h2>
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
