import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paperAPI } from "../utils/api";

const MyPapers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [papers, setPapers] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await paperAPI.getMyPapers();
        if (mounted) {
          if (res?.success) {
            setPapers(res.data || []);
          } else {
            setError(res?.message || "Failed to fetch papers");
          }
        }
      } catch (e) {
        if (mounted) {
          setError(
            e?.response?.data?.message ||
              "Failed to fetch papers. Please ensure the backend endpoint 'GET /api/teachers/my-question-papers' exists."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const viewPaper = (paperDoc) => {
    try {
      const paperData = paperDoc.paper || paperDoc.question_paper || paperDoc;
      sessionStorage.setItem("generatedPaperData", JSON.stringify(paperData));
      console.log("paperData", paperData);
      console.log("paperDoc", paperDoc);
      navigate(`/paper/${paperDoc._id}`);
    } catch (e) {
      alert("Unable to open paper");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            My Question Papers
          </h1>
        </div>

        {loading && <div className="text-gray-600">Loading your papers...</div>}
        {!loading && error && (
          <div className="p-3 mb-3 text-sm text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}
        {!loading && !error && papers.length === 0 && (
          <div className="text-gray-600">No papers found.</div>
        )}

        {!loading && papers.length > 0 && (
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="p-3">Subject</th>
                <th className="p-3">Class</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {papers.map((p) => (
                <tr key={p._id} className="bg-white border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">
                    {p.subject || "N/A"}
                  </td>
                  <td className="p-3">{p.classGrade || "N/A"}</td>
                  <td className="p-3">{p.status || "draft"}</td>
                  <td className="p-3">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => viewPaper(p)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MyPapers;
