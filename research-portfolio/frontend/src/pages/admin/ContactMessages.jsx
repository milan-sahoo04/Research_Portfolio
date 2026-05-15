import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import ContactTable from "../../components/Admin/ContactTable.jsx"; // import table component

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setMessages(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const deleteMessage = async (id) => {
    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);
    if (error) console.error(error);
    else fetchMessages();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Contact Messages</h1>

      {loading ? (
        <p>Loading messages...</p>
      ) : (
        <ContactTable messages={messages} onDelete={deleteMessage} />
      )}
    </div>
  );
};

export default ContactMessages;
