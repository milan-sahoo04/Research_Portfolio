import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const BlogForm = ({ fetchBlogs, editingBlog, setEditingBlog }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (editingBlog) {
      setTitle(editingBlog.title);
      setAuthor(editingBlog.author);
      setTags(editingBlog.tags.join(", "));
      setContent(editingBlog.content);
    } else {
      setTitle("");
      setAuthor("");
      setTags("");
      setContent("");
      setImageFile(null);
    }
  }, [editingBlog]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let image_url = editingBlog?.image_url || null;

    if (imageFile) {
      const fileName = `${Date.now()}_${imageFile.name}`;
      const { data, error } = await supabase.storage
        .from("uploads")
        .upload(fileName, imageFile);
      if (error) {
        console.error(error);
        return;
      }
      image_url = data.path;
    }

    const tagsArray = tags.split(",").map((t) => t.trim());

    if (editingBlog) {
      // Update blog
      const { error } = await supabase
        .from("blogs")
        .update({ title, author, tags: tagsArray, content, image_url })
        .eq("id", editingBlog.id);
      if (error) console.error(error);
      else setEditingBlog(null);
    } else {
      // Add new blog
      const { error } = await supabase
        .from("blogs")
        .insert([{ title, author, tags: tagsArray, content, image_url }]);
      if (error) console.error(error);
    }

    fetchBlogs();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <input
        type="text"
        placeholder="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="border p-2 w-full"
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
        className="border p-2 w-full"
      />
      <button
        type="submit"
        className="bg-purple-500 text-white px-4 py-2 rounded"
      >
        {editingBlog ? "Update" : "Add"} Blog
      </button>
      {editingBlog && (
        <button
          type="button"
          onClick={() => setEditingBlog(null)}
          className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      )}
    </form>
  );
};

export default BlogForm;
