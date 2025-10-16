import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";

// --- avatars ---
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import avatar5 from "../assets/avatars/avatar5.png";
import avatar6 from "../assets/avatars/avatar6.png";
import avatar7 from "../assets/avatars/avatar7.png";
import avatar8 from "../assets/avatars/avatar8.png";
import avatar9 from "../assets/avatars/avatar9.png";
import avatar10 from "../assets/avatars/avatar10.png";
import avatar11 from "../assets/avatars/avatar11.png";
import avatar12 from "../assets/avatars/avatar12.png";
import avatar13 from "../assets/avatars/avatar13.png";
import avatar14 from "../assets/avatars/avatar14.png";
import avatar15 from "../assets/avatars/avatar15.png";
import avatar16 from "../assets/avatars/avatar16.png";

// 🧩 subcomponents
import ProfileBio from "./profile/ProfileBio";
import SystemSettings from "./profile/SystemSettings";
import MoodSettings from "./profile/MoodSettings";
import SecurityAccount from "./profile/SecurityAccount";

const avatarOptions = [
  avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8,
  avatar9, avatar10, avatar11, avatar12, avatar13, avatar14, avatar15, avatar16,
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("Bio");
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    gender: "",
    date_of_birth: "",
    avatar_url: avatarOptions[0],
  });
  const [onboarding, setOnboarding] = useState({ mood: "", goal: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [avatarEditing, setAvatarEditing] = useState(false);

  // Preferences
  const [preferences, setPreferences] = useState({
    tone: "Calm",
    theme: "Light",
    defaultMode: "Conversation",
    autoGreet: true,
    notifications: false,
    voice: "Female",
    playbackSpeed: 1.0,
  });

  const moodData = [
    { day: "Mon", mood: 3 },
    { day: "Tue", mood: 4 },
    { day: "Wed", mood: 2 },
    { day: "Thu", mood: 5 },
    { day: "Fri", mood: 4 },
    { day: "Sat", mood: 3 },
    { day: "Sun", mood: 5 },
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUser(data.user);
        setProfile((prev) => ({
          ...prev,
          full_name: data.user.user_metadata?.full_name || data.user.email.split("@")[0],
          email: data.user.email,
        }));
      } else {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const getProfile = async () => {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile((prev) => ({
            ...prev,
            gender: profileData.gender || "",
            date_of_birth: profileData.date_of_birth || "",
            avatar_url: profileData.avatar_url || avatarOptions[0],
          }));
        }

        const { data: onboardingData } = await supabase
          .from("onboarding")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (onboardingData?.length > 0) {
          const latest = onboardingData[0];
          setOnboarding({
            id: latest.id,
            mood: latest.answers?.mood || "",
            goal: latest.answers?.goal || "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      gender: profile.gender,
      date_of_birth: profile.date_of_birth,
      avatar_url: profile.avatar_url,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      toast.error("Failed to update profile.");
      return;
    }

    const { error: onboardingError } = await supabase
      .from("onboarding")
      .upsert(
        {
          user_id: user.id,
          answers: { mood: onboarding.mood, goal: onboarding.goal },
        },
        { onConflict: ["user_id"] }
      );

    if (onboardingError) {
      toast.error("Failed to update mood & goal.");
      return;
    }

    toast.success("Profile updated successfully!");
    setIsEditing(false);
    setAvatarEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-100 to-peach-100">
        <p className="text-pink-700 font-medium text-lg animate-pulse">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-100 to-peach-100 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl px-8 pt-24 relative grid grid-cols-5 gap-8 min-h-[65vh]">
        <button
          onClick={() => navigate("/chat")}
          className="absolute top-6 left-6 text-pink-600 font-medium hover:underline"
        >
          ← Back
        </button>

        <motion.h2
          className="absolute top-6 left-1/2 transform -translate-x-1/2 text-3xl font-bold text-pink-700"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          My Profile
        </motion.h2>

        {/* LEFT MENU */}
        <div className="col-span-1 border-r border-gray-200 pt-6 space-y-2 bg-rose-50 rounded-l-2xl p-4">
          {["Bio", "System Settings", "Mood Settings", "Security & Account"].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => {
                setActiveSection(tab);
                setIsEditing(false);
                setAvatarEditing(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                activeSection === tab
                  ? "bg-pink-100 text-pink-700"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* RIGHT CONTENT */}
        <div className="col-span-4 overflow-y-auto">
          <AnimatePresence exitBeforeEnter>
            {activeSection === "Bio" && (
              <motion.div
                key="bio"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ProfileBio
                  profile={profile}
                  setProfile={setProfile}
                  onboarding={onboarding}
                  setOnboarding={setOnboarding}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  avatarEditing={avatarEditing}
                  setAvatarEditing={setAvatarEditing}
                  avatarOptions={avatarOptions}
                  handleSave={handleSave}
                />
              </motion.div>
            )}

            {activeSection === "System Settings" && (
              <motion.div
                key="system"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SystemSettings preferences={preferences} setPreferences={setPreferences} />
              </motion.div>
            )}

            {activeSection === "Mood Settings" && (
              <motion.div
                key="mood"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MoodSettings moodData={moodData} />
              </motion.div>
            )}

            {activeSection === "Security & Account" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SecurityAccount profile={profile} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </div>
  );
};

export default ProfilePage;
