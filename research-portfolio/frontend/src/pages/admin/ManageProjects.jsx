import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import ProjectForm from "../../components/Admin/ProjectForm.jsx";

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProj, setEditingProj] = useState(null);

  // Fetch all projects
  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("title", { ascending: true });
    if (error) console.error(error);
    else setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Delete project
  const deleteProject = async (id) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) console.error(error);
    else fetchProjects();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Projects</h1>

      {/* Form for Add/Edit */}
      <ProjectForm
        fetchProjects={fetchProjects}
        editingProj={editingProj}
        setEditingProj={setEditingProj}
      />

      {/* Project list */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full mt-6 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Title</th>
              <th className="p-2">Technologies</th>
              <th className="p-2">Category</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => (
              <tr key={proj.id} className="border-t">
                <td className="p-2">{proj.title}</td>
                <td className="p-2">{proj.technologies.join(", ")}</td>
                <td className="p-2">{proj.category}</td>
                <td className="p-2 space-x-2">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() => setEditingProj(proj)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => deleteProject(proj.id)}
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

export default ManageProjects;
