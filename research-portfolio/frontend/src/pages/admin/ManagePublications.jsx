import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import PublicationForm from "../../components/Admin/PublicationForm.jsx";

const ManagePublications = () => {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPub, setEditingPub] = useState(null);

  // Fetch all publications
  const fetchPublications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("publications")
      .select("*")
      .order("year", { ascending: false });
    if (error) console.error(error);
    else setPublications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  // Delete publication
  const deletePublication = async (id) => {
    const { error } = await supabase.from("publications").delete().eq("id", id);
    if (error) console.error(error);
    else fetchPublications();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Publications</h1>

      {/* Form for Add/Edit */}
      <PublicationForm
        fetchPublications={fetchPublications}
        editingPub={editingPub}
        setEditingPub={setEditingPub}
      />

      {/* Publication list */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full mt-6 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Title</th>
              <th className="p-2">Authors</th>
              <th className="p-2">Year</th>
              <th className="p-2">Journal</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {publications.map((pub) => (
              <tr key={pub.id} className="border-t">
                <td className="p-2">{pub.title}</td>
                <td className="p-2">{pub.authors.join(", ")}</td>
                <td className="p-2">{pub.year}</td>
                <td className="p-2">{pub.journal}</td>
                <td className="p-2 space-x-2">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() => setEditingPub(pub)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => deletePublication(pub.id)}
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

export default ManagePublications;
