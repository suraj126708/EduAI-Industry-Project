import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const AdminPapers = () => {
  const { adminService } = useAuth();
  const [papers, setPapers] = useState([]);

  useEffect(() => {
    // Replace below with your real API/logic
    adminService.getPapers && adminService.getPapers().then((res) => {
      if (res.success) setPapers(res.data.papers || []);
    });
  }, [adminService]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">All Question Papers</h2>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Title</th>
            <th className="border px-4 py-2">Subject</th>
            <th className="border px-4 py-2">Class</th>
            <th className="border px-4 py-2">Created At</th>
          </tr>
        </thead>
        <tbody>
          {papers.length === 0 && (
            <tr>
              <td className="border px-4 py-2" colSpan={4}>
                No papers found.
              </td>
            </tr>
          )}
          {papers.map((paper) => (
            <tr key={paper._id}>
              <td className="border px-4 py-2">{paper.title}</td>
              <td className="border px-4 py-2">{paper.subject || "-"}</td>
              <td className="border px-4 py-2">{paper.class || "-"}</td>
              <td className="border px-4 py-2">{new Date(paper.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPapers;
