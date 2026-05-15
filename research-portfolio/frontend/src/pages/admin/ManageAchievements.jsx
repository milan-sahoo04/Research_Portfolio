import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import AchievementForm from "../../components/Admin/AchievementForm.jsx";

const ManageAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAch, setEditingAch] = useState(null);

  // Fetch achievements
  const fetchAchievements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("year", { ascending: false });
    if (error) console.error(error);
    else setAchievements(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  // Delete achievement
  const deleteAchievement = async (id) => {
    const { error } = await supabase.from("achievements").delete().eq("id", id);
    if (error) console.error(error);
    else fetchAchievements();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Achievements / Patents</h1>

      {/* Form for Add/Edit */}
      <AchievementForm
        fetchAchievements={fetchAchievements}
        editingAch={editingAch}
        setEditingAch={setEditingAch}
      />

      {/* List of achievements */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full mt-6 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Title</th>
              <th className="p-2">Type</th>
              <th className="p-2">Year</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map((ach) => (
              <tr key={ach.id} className="border-t">
                <td className="p-2">{ach.title}</td>
                <td className="p-2">{ach.type}</td>
                <td className="p-2">{ach.year}</td>
                <td className="p-2 space-x-2">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() => setEditingAch(ach)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => deleteAchievement(ach.id)}
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

export default ManageAchievements;
