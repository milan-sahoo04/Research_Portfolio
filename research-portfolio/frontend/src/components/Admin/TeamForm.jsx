import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const TeamForm = ({ fetchTeam, editingMember, setEditingMember }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name);
      setRole(editingMember.role);
      setLinkedin(editingMember.linkedin_url);
      setGithub(editingMember.github_url);
    } else {
      setName("");
      setRole("");
      setLinkedin("");
      setGithub("");
      setPhotoFile(null);
    }
  }, [editingMember]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let photo_url = editingMember?.photo_url || null;

    if (photoFile) {
      const fileName = `${Date.now()}_${photoFile.name}`;
      const { data, error } = await supabase.storage
        .from("uploads")
        .upload(fileName, photoFile);
      if (error) {
        console.error(error);
        return;
      }
      photo_url = data.path;
    }

    if (editingMember) {
      // Update
      const { error } = await supabase
        .from("team_members")
        .update({
          name,
          role,
          linkedin_url: linkedin,
          github_url: github,
          photo_url,
        })
        .eq("id", editingMember.id);
      if (error) console.error(error);
      else setEditingMember(null);
    } else {
      // Insert
      const { error } = await supabase
        .from("team_members")
        .insert([
          { name, role, linkedin_url: linkedin, github_url: github, photo_url },
        ]);
      if (error) console.error(error);
    }

    fetchTeam();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <input
        type="text"
        placeholder="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <input
        type="text"
        placeholder="LinkedIn URL"
        value={linkedin}
        onChange={(e) => setLinkedin(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="GitHub URL"
        value={github}
        onChange={(e) => setGithub(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhotoFile(e.target.files[0])}
        className="border p-2 w-full"
      />
      <button
        type="submit"
        className="bg-yellow-500 text-white px-4 py-2 rounded"
      >
        {editingMember ? "Update" : "Add"} Team Member
      </button>
      {editingMember && (
        <button
          type="button"
          onClick={() => setEditingMember(null)}
          className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      )}
    </form>
  );
};

export default TeamForm;
