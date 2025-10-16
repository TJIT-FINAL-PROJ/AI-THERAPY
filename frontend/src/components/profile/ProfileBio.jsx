import React from "react";
import { Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ProfileBio = ({
  profile,
  setProfile,
  isEditing,
  setIsEditing,
  avatarEditing,
  setAvatarEditing,
  avatarOptions,
  handleSave,
}) => {
  return (
    <div className="grid grid-cols-2 gap-8 text-gray-900 dark:text-gray-50 transition-colors duration-300">
      {/* Avatar */}
      <div className="flex justify-center items-center flex-col">
        <motion.img
          src={profile.avatar_url || avatarOptions[0]}
          alt="Avatar"
          className="w-56 h-56 rounded-full border-4 border-rose-500 object-cover transition-colors duration-300"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        {isEditing && (
          <motion.button
            onClick={() => setAvatarEditing(!avatarEditing)}
            className="mt-3 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow hover:bg-emerald-50 dark:hover:bg-gray-700 flex items-center gap-1 text-sm text-gray-900 dark:text-gray-50 transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
          >
            <Pencil className="w-4 h-4 text-rose-600 dark:text-pink-400" /> Change Avatar
          </motion.button>
        )}
        <AnimatePresence>
          {isEditing && avatarEditing && (
            <motion.div
              className="mt-5 grid grid-cols-4 gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {avatarOptions.map((url, idx) => (
                <motion.img
                  key={idx}
                  src={url}
                  alt={`Avatar ${idx + 1}`}
                  onClick={() => setProfile({ ...profile, avatar_url: url })}
                  className={`w-14 h-14 rounded-full cursor-pointer border-4 transition-all duration-300 ${
                    profile.avatar_url === url
                      ? "border-pink-500 dark:border-pink-400"
                      : "border-transparent hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                  whileHover={{ scale: 1.1 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Details */}
      <div className="flex flex-col space-y-4">
        {/* Full Name */}
        <div className="flex flex-col">
          <label className="font-medium text-gray-700 dark:text-gray-200">Full Name</label>
          <input
            type="text"
            value={profile.full_name}
            disabled
            className="border p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50 cursor-not-allowed transition-colors duration-300"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <label className="font-medium text-gray-700 dark:text-gray-200">Email</label>
          <input
            type="text"
            value={profile.email}
            disabled
            className="border p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50 cursor-not-allowed transition-colors duration-300"
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col">
          <label className="font-medium text-gray-700 dark:text-gray-200">Gender</label>
          {isEditing ? (
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="border p-2 rounded border-pink-400 dark:border-pink-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 transition-colors duration-300"
            >
              <option value="">Select gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Other</option>
            </select>
          ) : (
            <p className="border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50 p-2 transition-colors duration-300">
              {profile.gender || "Not set"}
            </p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="flex flex-col">
          <label className="font-medium text-gray-700 dark:text-gray-200">Date of Birth</label>
          {isEditing ? (
            <input
              type="date"
              value={profile.date_of_birth}
              onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              className="border p-2 rounded border-pink-400 dark:border-pink-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 transition-colors duration-300"
            />
          ) : (
            <p className="border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50 p-2 transition-colors duration-300">
              {profile.date_of_birth || "Not set"}
            </p>
          )}
        </div>

        {/* Edit / Save Buttons */}
        <div className="mt-4 flex gap-4">
          {isEditing ? (
            <>
              <motion.button
                onClick={handleSave}
                className="px-4 py-2 bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
              >
                Save
              </motion.button>
              <motion.button
                onClick={() => {
                  setIsEditing(false);
                  setAvatarEditing(false);
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
              >
                Cancel
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={() => setIsEditing(true)}
              className="mt-3 bg-rose-600 dark:bg-rose-700 text-white px-4 py-1 rounded-lg shadow hover:bg-rose-700 dark:hover:bg-rose-600 transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
            >
              Edit
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileBio;
