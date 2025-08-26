import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Pencil } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

// Import avatars
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

const avatarOptions = [
  avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8,
  avatar9, avatar10, avatar11, avatar12, avatar13, avatar14, avatar15, avatar16,
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Load user first
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUser(data.user);
        setProfile((prev) => ({
          ...prev,
          full_name:
            data.user.user_metadata?.full_name ||
            data.user.email.split("@")[0],
          email: data.user.email,
        }));
      } else {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  // Fetch profile + onboarding once we have user
  useEffect(() => {
    if (!user?.id) return;

    const getProfile = async () => {
      try {
        // Profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error(profileError);
        }

        if (profileData) {
          setProfile((prev) => ({
            ...prev,
            gender: profileData.gender || "",
            date_of_birth: profileData.date_of_birth || "",
            avatar_url: profileData.avatar_url || avatarOptions[0],
          }));
        }

        // Onboarding table
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

  // Save updates
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
      console.error(profileError);
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
      console.error(onboardingError);
      toast.error("Failed to update mood & goal.");
      return;
    }

    toast.success("Profile updated successfully!");
    setIsEditing(false);
    setAvatarEditing(false);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
        <p className="text-emerald-700 font-medium text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl px-8 pt-24 relative grid grid-cols-2 gap-8 min-h-[65vh]">
        {/* Title */}
        <h2 className="absolute top-6 left-1/2 transform -translate-x-1/2 text-3xl font-bold text-emerald-700">
          Profile Details
        </h2>

        {/* Back button */}
        {!isEditing && (
          <button
            onClick={() => navigate("/chat")}
            className="absolute top-6 left-6 text-emerald-600 font-medium hover:underline"
          >
            ← Back
          </button>
        )}

        {/* Edit button */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-6 right-6 bg-emerald-600 text-white px-4 py-1 rounded-lg shadow hover:bg-emerald-700"
          >
            Edit
          </button>
        )}

        {/* Left: Avatar */}
        <div className="flex justify-center items-center flex-col">
          <img
            src={profile.avatar_url || avatarOptions[0]}
            alt="Avatar"
            className="w-56 h-56 rounded-full border-4 border-emerald-500 object-cover"
          />
          {isEditing && (
            <button
              onClick={() => setAvatarEditing(!avatarEditing)}
              className="mt-3 bg-white px-3 py-1 rounded-lg shadow hover:bg-emerald-50 flex items-center gap-1 text-sm"
            >
              <Pencil className="w-4 h-4 text-emerald-600" /> Change Avatar
            </button>
          )}

          {isEditing && avatarEditing && (
            <div className="mt-5 grid grid-cols-4 gap-2">
              {avatarOptions.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Avatar ${idx + 1}`}
                  onClick={() => setProfile({ ...profile, avatar_url: url })}
                  className={`w-14 h-14 rounded-full cursor-pointer border-4 transition ${
                    profile.avatar_url === url
                      ? "border-emerald-500"
                      : "border-transparent hover:border-gray-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex flex-col justify-start space-y-3 text-sm">
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-medium">Full Name</label>
            <input
              type="text"
              value={profile.full_name}
              disabled
              className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium">Email</label>
            <input
              type="text"
              value={profile.email}
              disabled
              className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-gray-700 font-medium">Gender</label>
            {isEditing ? (
              <select
                value={profile.gender}
                onChange={(e) =>
                  setProfile({ ...profile, gender: e.target.value })
                }
                className="w-full border p-2 rounded bg-white border-emerald-400"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            ) : (
              <p className="p-2 border rounded bg-gray-100 text-sm">
                {profile.gender || "Not set"}
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-gray-700 font-medium">Date of Birth</label>
            {isEditing ? (
              <input
                type="date"
                value={profile.date_of_birth}
                onChange={(e) =>
                  setProfile({ ...profile, date_of_birth: e.target.value })
                }
                className="w-full border p-2 rounded bg-white border-emerald-400"
              />
            ) : (
              <p className="p-2 border rounded bg-gray-100 text-sm">
                {profile.date_of_birth || "Not set"}
              </p>
            )}
          </div>

          {/* Mood */}
          <div>
            <label className="block text-gray-700 font-medium">Mood</label>
            {isEditing ? (
              <input
                type="text"
                value={onboarding.mood}
                onChange={(e) =>
                  setOnboarding({ ...onboarding, mood: e.target.value })
                }
                className="w-full border p-2 rounded bg-white border-emerald-400 text-sm"
              />
            ) : (
              <p className="p-2 border rounded bg-gray-100 text-sm">
                {onboarding.mood || "Not set"}
              </p>
            )}
          </div>

          {/* Goal */}
          <div>
            <label className="block text-gray-700 font-medium">Goal</label>
            {isEditing ? (
              <input
                type="text"
                value={onboarding.goal}
                onChange={(e) =>
                  setOnboarding({ ...onboarding, goal: e.target.value })
                }
                className="w-full border p-2 rounded bg-white border-emerald-400"
              />
            ) : (
              <p className="p-2 border rounded bg-gray-100 text-sm ">
                {onboarding.goal || "Not set"}
              </p>
            )}
          </div>

          {/* Save / Cancel */}
          {isEditing && (
            <div className="mt-4 flex gap-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setAvatarEditing(false);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg shadow hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </div>
  );
};

export default ProfilePage;
