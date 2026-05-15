import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const PublicationForm = ({ fetchPublications, editingPub, setEditingPub }) => {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [journal, setJournal] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  useEffect(() => {
    if (editingPub) {
      setTitle(editingPub.title);
      setAuthors(editingPub.authors.join(", "));
      setYear(editingPub.year);
      setJournal(editingPub.journal);
    } else {
      setTitle("");
      setAuthors("");
      setYear("");
      setJournal("");
      setPdfFile(null);
    }
  }, [editingPub]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let pdf_url = editingPub?.pdf_url || null;

    // Upload PDF if selected
    if (pdfFile) {
      const fileName = `${Date.now()}_${pdfFile.name}`;
      const { data, error } = await supabase.storage
        .from("uploads")
        .upload(fileName, pdfFile);
      if (error) {
        console.error(error);
        return;
      }
      pdf_url = data.path;
    }

    const authorsArray = authors.split(",").map((a) => a.trim());

    if (editingPub) {
      // Update
      const { error } = await supabase
        .from("publications")
        .update({ title, authors: authorsArray, year, journal, pdf_url })
        .eq("id", editingPub.id);
      if (error) console.error(error);
      else setEditingPub(null);
    } else {
      // Insert
      const { error } = await supabase
        .from("publications")
        .insert([{ title, authors: authorsArray, year, journal, pdf_url }]);
      if (error) console.error(error);
    }

    fetchPublications();
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
        placeholder="Authors (comma separated)"
        value={authors}
        onChange={(e) => setAuthors(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <input
        type="number"
        placeholder="Year"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <input
        type="text"
        placeholder="Journal"
        value={journal}
        onChange={(e) => setJournal(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setPdfFile(e.target.files[0])}
        className="border p-2 w-full"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {editingPub ? "Update" : "Add"} Publication
      </button>
      {editingPub && (
        <button
          type="button"
          onClick={() => setEditingPub(null)}
          className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      )}
    </form>
  );
};

export default PublicationForm;
