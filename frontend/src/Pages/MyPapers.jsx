import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paperAPI } from "../utils/api";

const MyPapers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // const [papers, setPapers] = useState([]);
  const [groupedPapers, setGroupedPapers] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await paperAPI.getMyPapers();
        if (mounted) {
          if (res?.success) {
            const papers = res.data || [];
            // --- START: NEW GROUPING LOGIC ---
            const groups = papers.reduce((acc, paper) => {
              // --- START: CORRECTED LOGIC ---
              // This fallback now includes the time, rounded to the minute,
              // ensuring only papers generated in the same batch are grouped.
              const creationDate = new Date(paper.createdAt);
              creationDate.setSeconds(0, 0); // Round down to the start of the minute
              const preciseTimestamp = creationDate.toISOString();

              const batchId =
                paper.generationBatchId ||
                `${paper.subject}-${paper.classGrade}-${preciseTimestamp}`;
              // --- END: CORRECTED LOGIC ---

              if (!acc[batchId]) {
                acc[batchId] = {
                  id: batchId,
                  subject: paper.subject,
                  classGrade: paper.classGrade,
                  status: paper.status,
                  createdAt: paper.createdAt,
                  papers: [],
                };
              }
              acc[batchId].papers.push(paper);
              return acc;
            }, {});

            // Convert the groups object into a sorted array for rendering
            const groupedArray = Object.values(groups)
              .map((group) => ({
                ...group,
                count: group.papers.length,
              }))
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setGroupedPapers(groupedArray);
            // --- END: NEW GROUPING LOGIC ---
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

  // Updated to handle a group of papers
  const viewPaper = (paperGroup) => {
    try {
      // Store the entire array of papers in the group for the next page to use
      sessionStorage.setItem(
        "paperBatchData",
        JSON.stringify(paperGroup.papers)
      );
      // Navigate to the view page using the ID of the first paper in the group
      navigate(`/paper/${paperGroup.papers[0]._id}`);
    } catch (e) {
      console.error("Failed to navigate to paper:", e);
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
        {!loading && !error && groupedPapers.length === 0 && (
          <div className="text-gray-600">No papers found.</div>
        )}

        {/* Check groupedPapers instead of papers */}
        {!loading && !error && groupedPapers.length > 0 && (
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="p-3">Subject</th>
                <th className="p-3">Class</th>
                <th className="p-3">Sets</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Now mapping over the grouped papers */}
              {groupedPapers.map((g) => (
                <tr key={g.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">
                    {g.subject || "N/A"}
                  </td>
                  <td className="p-3">{g.classGrade || "N/A"}</td>
                  <td className="p-3 font-semibold text-center">{g.count}</td>
                  <td className="p-3">{g.status || "draft"}</td>
                  <td className="p-3">
                    {g.createdAt ? new Date(g.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => viewPaper(g)} // Pass the whole group object
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
