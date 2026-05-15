import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const ProjectForm = ({ fetchProjects, editingProj, setEditingProj }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [category, setCategory] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (editingProj) {
      setTitle(editingProj.title);
      setDescription(editingProj.description);
      setTechnologies(editingProj.technologies.join(", "));
      setCategory(editingProj.category);
      setGithubUrl(editingProj.github_url);
      setDemoUrl(editingProj.demo_url);
    } else {
      setTitle("");
      setDescription("");
      setTechnologies("");
      setCategory("");
      setGithubUrl("");
      setDemoUrl("");
      setImageFile(null);
    }
  }, [editingProj]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let image_url = editingProj?.image_url || null;

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

    const techArray = technologies.split(",").map((t) => t.trim());

    if (editingProj) {
      // Update project
      const { error } = await supabase
        .from("projects")
        .update({
          title,
          description,
          technologies: techArray,
          category,
          github_url: githubUrl,
          demo_url: demoUrl,
          image_url,
        })
        .eq("id", editingProj.id);
      if (error) console.error(error);
      else setEditingProj(null);
    } else {
      // Insert new project
      const { error } = await supabase
        .from("projects")
        .insert([
          {
            title,
            description,
            technologies: techArray,
            category,
            github_url: githubUrl,
            demo_url: demoUrl,
            image_url,
          },
        ]);
      if (error) console.error(error);
    }

    fetchProjects();
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
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="Technologies (comma separated)"
        value={technologies}
        onChange={(e) => setTechnologies(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="GitHub URL"
        value={githubUrl}
        onChange={(e) => setGithubUrl(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="Demo URL"
        value={demoUrl}
        onChange={(e) => setDemoUrl(e.target.value)}
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
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        {editingProj ? "Update" : "Add"} Project
      </button>
      {editingProj && (
        <button
          type="button"
          onClick={() => setEditingProj(null)}
          className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      )}
    </form>
  );
};

export default ProjectForm;
