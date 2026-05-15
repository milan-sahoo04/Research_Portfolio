import React from "react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link
          to="/admin/manage-publications"
          className="p-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Manage Publications
        </Link>
        <Link
          to="/admin/manage-projects"
          className="p-4 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Manage Projects
        </Link>
        <Link
          to="/admin/manage-blogs"
          className="p-4 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Manage Blogs
        </Link>
        <Link
          to="/admin/manage-team"
          className="p-4 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Manage Team
        </Link>
        <Link
          to="/admin/manage-achievements"
          className="p-4 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Manage Achievements
        </Link>
        <Link
          to="/admin/contact-messages"
          className="p-4 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Contact Messages
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
