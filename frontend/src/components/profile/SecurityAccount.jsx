import React from "react";

const SecurityAccount = ({ profile }) => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <h3 className="text-xl font-semibold text-pink-700">
        Account Security
      </h3>

      <p>
        <span className="font-medium text-gray-800">Email:</span>{" "}
        {profile.email}
      </p>

      <div className="flex gap-4 mt-4">
        <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition">
          Change Password
        </button>

        <button className="border border-red-500 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition">
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default SecurityAccount;
