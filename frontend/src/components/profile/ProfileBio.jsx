import React from "react";
import { Pencil } from "lucide-react";

const ProfileBio = ({
  profile,
  setProfile,
  onboarding,
  setOnboarding,
  isEditing,
  setIsEditing,
  avatarEditing,
  setAvatarEditing,
  avatarOptions,
  handleSave,
}) => (
  <div className="grid grid-cols-2 gap-8">
    {/* Avatar */}
    <div className="flex justify-center items-center flex-col">
      <img
        src={profile.avatar_url || avatarOptions[0]}
        alt="Avatar"
        className="w-56 h-56 rounded-full border-4 border-rose-500 object-cover"
      />
      {isEditing && (
        <button
          onClick={() => setAvatarEditing(!avatarEditing)}
          className="mt-3 bg-white px-3 py-1 rounded-lg shadow hover:bg-emerald-50 flex items-center gap-1 text-sm"
        >
          <Pencil className="w-4 h-4 text-rose-600" /> Change Avatar
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
                  ? "border-pink-500"
                  : "border-transparent hover:border-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>

    {/* Details */}
    <div className="flex flex-col space-y-3 text-sm">
      <label className="font-medium text-gray-700">Full Name</label>
      <input
        type="text"
        value={profile.full_name}
        disabled
        className="border p-2 rounded bg-gray-100 cursor-not-allowed"
      />
      <label className="font-medium text-gray-700">Email</label>
      <input
        type="text"
        value={profile.email}
        disabled
        className="border p-2 rounded bg-gray-100 cursor-not-allowed"
      />

      <label className="font-medium text-gray-700">Gender</label>
      {isEditing ? (
        <select
          value={profile.gender}
          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
          className="border p-2 rounded border-pink-400"
        >
          <option value="">Select gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Non-binary</option>
          <option>Other</option>
        </select>
      ) : (
        <p className="border rounded bg-gray-100 p-2">{profile.gender || "Not set"}</p>
      )}

      <label className="font-medium text-gray-700">Date of Birth</label>
      {isEditing ? (
        <input
          type="date"
          value={profile.date_of_birth}
          onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
          className="border p-2 rounded border-pink-400"
        />
      ) : (
        <p className="border rounded bg-gray-100 p-2">
          {profile.date_of_birth || "Not set"}
        </p>
      )}

      <label className="font-medium text-gray-700">Mood</label>
      {isEditing ? (
        <input
          type="text"
          value={onboarding.mood}
          onChange={(e) => setOnboarding({ ...onboarding, mood: e.target.value })}
          className="border p-2 rounded border-pink-400"
        />
      ) : (
        <p className="border rounded bg-gray-100 p-2">{onboarding.mood || "Not set"}</p>
      )}

      <label className="font-medium text-gray-700">Goal</label>
      {isEditing ? (
        <input
          type="text"
          value={onboarding.goal}
          onChange={(e) => setOnboarding({ ...onboarding, goal: e.target.value })}
          className="border p-2 rounded border-pink-400"
        />
      ) : (
        <p className="border rounded bg-gray-100 p-2">{onboarding.goal || "Not set"}</p>
      )}

      {isEditing ? (
        <div className="mt-4 flex gap-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Save
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setAvatarEditing(false);
            }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="mt-3 bg-rose-600 text-white px-4 py-1 rounded-lg shadow hover:bg-rose-700"
        >
          Edit
        </button>
      )}
    </div>
  </div>
);

export default ProfileBio;
