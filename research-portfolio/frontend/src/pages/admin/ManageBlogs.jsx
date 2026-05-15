import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import BlogForm from "../../components/Admin/BlogForm.jsx";

const ManageBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);

  // Fetch all blogs
  const fetchBlogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) console.error(error);
    else setBlogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Delete blog
  const deleteBlog = async (id) => {
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) console.error(error);
    else fetchBlogs();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Blogs</h1>

      {/* Form for Add/Edit */}
      <BlogForm
        fetchBlogs={fetchBlogs}
        editingBlog={editingBlog}
        setEditingBlog={setEditingBlog}
      />

      {/* Blog list */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full mt-6 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Title</th>
              <th className="p-2">Author</th>
              <th className="p-2">Tags</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((blog) => (
              <tr key={blog.id} className="border-t">
                <td className="p-2">{blog.title}</td>
                <td className="p-2">{blog.author}</td>
                <td className="p-2">{blog.tags.join(", ")}</td>
                <td className="p-2 space-x-2">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() => setEditingBlog(blog)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => deleteBlog(blog.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageBlogs;
