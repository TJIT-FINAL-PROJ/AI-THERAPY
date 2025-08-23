// src/components/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
      }
      setUser(data?.user || null);
      setLoading(false);
    };

    getUser();
  }, []);

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
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-emerald-600 mb-6 text-center">
          Profile Details
        </h1>
        <div className="space-y-4 text-gray-700">
          <p><span className="font-semibold">Full Name:</span> {user_metadata?.full_name || "Not provided"}</p>
          <p><span className="font-semibold">Email:</span> {email}</p>
          <p><span className="font-semibold">Gender:</span> {user_metadata?.gender || "Not provided"}</p>
          <p><span className="font-semibold">Address:</span> {user_metadata?.address || "Not provided"}</p>
          <p><span className="font-semibold">Mood:</span> {user_metadata?.mood || "Not provided"}</p>
          <p><span className="font-semibold">Goal:</span> {user_metadata?.goal || "Not provided"}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
