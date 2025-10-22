import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, Loader2, AlertCircle } from "lucide-react";

const AdminPapers = () => {
  const { adminService } = useAuth();
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPapers = async () => {
      if (!adminService.getPapers) {
        setError("Paper service is not available.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const res = await adminService.getPapers();
        if (res.success) {
          // The data is now pre-grouped by the backend
          setPapers(res.data.papers || []);
        } else {
          setError(res.message || "Failed to fetch papers.");
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching papers.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPapers();
  }, [adminService]);

  const handleViewPaper = (paper) => {
    try {
      // 'paper.papers' is the array of all sets from our new aggregation
      // We store it in sessionStorage so the next page can find it.
      sessionStorage.setItem("paperBatchData", JSON.stringify(paper.papers));

      // Navigate to the view page using the ID of the first paper
      navigate(`/paper/${paper._id}`);
    } catch (e) {
      console.error("Failed to navigate to paper:", e);
      alert("Unable to open paper");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2">Loading papers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <span className="ml-2 text-red-800">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">All Question Papers</h2>
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Teacher
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Subject
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Class
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Exam Type
              </th>
              {/* --- ADDED THIS COLUMN --- */}
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                No. of Sets
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Time Allotted
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Created On
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {papers.length === 0 ? (
              <tr>
                <td
                  colSpan={8} // <-- Updated colSpan to 8
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                >
                  No papers found.
                </td>
              </tr>
            ) : (
              papers.map((paper) => (
                <tr key={paper._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {paper.createdBy ? (
                      <>
                        <div>{paper.createdBy.name}</div>
                        <div className="text-xs text-gray-500">
                          {paper.createdBy.email}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {paper.subject || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {/* --- Use classGrade --- */}
                    {paper.classGrade || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {paper.examType || "-"}
                  </td>

                  {/* --- ADDED THIS CELL --- */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium text-center">
                    {paper.sets || 1}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {paper.paper.timeAllowed || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(paper.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewPaper(paper)}
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                      title="View First Paper of Batch"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPapers;
