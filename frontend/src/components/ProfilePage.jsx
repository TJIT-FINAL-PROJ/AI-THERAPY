// src/components/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom"; // ✅ for navigation
import { ArrowLeft } from "lucide-react"; // ✅ arrow icon

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
      }
      setUser(data?.user || null);
      setFormData(data?.user?.user_metadata || {});
      setLoading(false);
    };
    getUser();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const { data, error } = await supabase.auth.updateUser({
      data: formData,
    });
    if (error) {
      console.error("Error updating user:", error.message);
    } else {
      setUser(data.user);
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        Loading user profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        No user logged in. Please sign in first.
      </div>
    );
  }

  const { email, user_metadata } = user;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg relative">
        
        {/* ✅ Back Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute left-4 top-4 flex items-center text-emerald-600 hover:text-emerald-800 font-semibold transition"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>

        <h1 className="text-2xl font-bold text-emerald-600 mb-6 text-center">
          Profile Details
        </h1>

        {isEditing ? (
          <div className="space-y-4 text-gray-700">
            <input
              type="text"
              name="full_name"
              value={formData.full_name || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Full Name"
            />
            <input
              type="text"
              name="gender"
              value={formData.gender || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Gender"
            />
            <input
              type="text"
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Address"
            />
            <input
              type="text"
              name="mood"
              value={formData.mood || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Mood"
            />
            <input
              type="text"
              name="goal"
              value={formData.goal || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Goal"
            />

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="bg-emerald-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-gray-700">
            <p>
              <span className="font-semibold">Full Name:</span>{" "}
              {user_metadata?.full_name || "Not provided"}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {email}
            </p>
            <p>
              <span className="font-semibold">Gender:</span>{" "}
              {user_metadata?.gender || "Not provided"}
            </p>
            <p>
              <span className="font-semibold">Address:</span>{" "}
              {user_metadata?.address || "Not provided"}
            </p>
            <p>
              <span className="font-semibold">Mood:</span>{" "}
              {user_metadata?.mood || "Not provided"}
            </p>
            <p>
              <span className="font-semibold">Goal:</span>{" "}
              {user_metadata?.goal || "Not provided"}
            </p>

            <button
              onClick={() => setIsEditing(true)}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
