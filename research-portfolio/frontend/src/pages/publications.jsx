import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import PublicationCard from "../components/PublicationCard.jsx";

const Publications = () => {
  const [publications, setPublications] = useState([]);
  const [search, setSearch] = useState("");

  const fetchPublications = async () => {
    let query = supabase
      .from("publications")
      .select("*")
      .order("year", { ascending: false });
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    const { data, error } = await query;
    if (error) console.error(error);
    else setPublications(data);
  };

  useEffect(() => {
    fetchPublications();
  }, [search]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Publications</h1>
      <input
        type="text"
        placeholder="Search by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 mb-6 w-full"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publications.map((pub) => (
          <PublicationCard key={pub.id} publication={pub} />
        ))}
      </div>
    </div>
  );
};

export default Publications;
