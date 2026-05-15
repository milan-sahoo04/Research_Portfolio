import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import ProjectCard from "../components/ProjectCard.jsx";

const Projects = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("title", { ascending: true });
      if (error) console.error(error);
      else setProjects(data);
    };
    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <ProjectCard key={proj.id} project={proj} />
        ))}
      </div>
    </div>
  );
};

export default Projects;
