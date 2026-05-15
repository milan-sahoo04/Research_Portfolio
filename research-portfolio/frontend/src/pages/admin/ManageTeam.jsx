import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import TeamForm from "../../components/Admin/TeamForm.jsx";

const ManageTeam = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);

  // Fetch all team members
  const fetchTeam = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("name", { ascending: true });
    if (error) console.error(error);
    else setTeamMembers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // Delete team member
  const deleteMember = async (id) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) console.error(error);
    else fetchTeam();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Team Members</h1>

      {/* Form for Add/Edit */}
      <TeamForm
        fetchTeam={fetchTeam}
        editingMember={editingMember}
        setEditingMember={setEditingMember}
      />

      {/* Team list */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full mt-6 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Name</th>
              <th className="p-2">Role</th>
              <th className="p-2">LinkedIn</th>
              <th className="p-2">GitHub</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr key={member.id} className="border-t">
                <td className="p-2">{member.name}</td>
                <td className="p-2">{member.role}</td>
                <td className="p-2">{member.linkedin_url}</td>
                <td className="p-2">{member.github_url}</td>
                <td className="p-2 space-x-2">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() => setEditingMember(member)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => deleteMember(member.id)}
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

export default ManageTeam;
