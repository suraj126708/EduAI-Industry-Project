import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, Loader2, AlertCircle, Search } from "lucide-react"; // Imported Search icon

const AdminPapers = () => {
  const { adminService } = useAuth();
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // State for search
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
      sessionStorage.setItem("paperBatchData", JSON.stringify(paper.papers));
      navigate(`/paper/${paper._id}`);
    } catch (e) {
      console.error("Failed to navigate to paper:", e);
      alert("Unable to open paper");
    }
  };

  // --- Filtering Logic ---
  const filteredPapers = papers.filter((paper) => {
    const query = searchQuery.toLowerCase();

    // Safely access properties to prevent crashes if data is missing
    const teacherName = paper.createdBy?.name?.toLowerCase() || "";
    const subject = paper.subject?.toLowerCase() || "";
    const classGrade = paper.classGrade?.toString().toLowerCase() || "";
    const examType = paper.examType?.toLowerCase() || "";

    return (
      teacherName.includes(query) ||
      subject.includes(query) ||
      classGrade.includes(query) ||
      examType.includes(query)
    );
  });

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
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          All Question Papers
        </h2>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by teacher, subject..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

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
            {filteredPapers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-base font-medium">No papers found</p>
                    <p className="text-sm mt-1">
                      Try adjusting your search criteria
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPapers.map((paper) => (
                <tr
                  key={paper._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {paper.createdBy ? (
                      <>
                        <div className="font-semibold text-gray-800">
                          {paper.createdBy.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {paper.createdBy.email}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Unknown</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {paper.subject || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {paper.classGrade || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {paper.examType || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium text-center">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">
                      {paper.sets || 1}
                    </span>
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors text-xs font-semibold uppercase tracking-wide"
                      title="View First Paper of Batch"
                    >
                      <Eye className="w-3.5 h-3.5" />
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
