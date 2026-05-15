import React from "react";

const ContactTable = ({ messages, onDelete }) => {
  if (!messages || messages.length === 0) return <p>No messages found.</p>;

  return (
    <table className="w-full mt-6 border">
      <thead>
        <tr className="bg-gray-200">
          <th className="p-2">Name</th>
          <th className="p-2">Email</th>
          <th className="p-2">Subject</th>
          <th className="p-2">Message</th>
          <th className="p-2">Date</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {messages.map((msg) => (
          <tr key={msg.id} className="border-t">
            <td className="p-2">{msg.name}</td>
            <td className="p-2">{msg.email}</td>
            <td className="p-2">{msg.subject}</td>
            <td className="p-2">{msg.message}</td>
            <td className="p-2">{new Date(msg.created_at).toLocaleString()}</td>
            <td className="p-2 space-x-2">
              <button
                className="bg-red-500 text-white px-2 py-1 rounded"
                onClick={() => onDelete(msg.id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ContactTable;
