import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const AdminResults = () => {
  const { adminService } = useAuth();
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Replace below with your results API/logic
    adminService.getResults && adminService.getResults().then((res) => {
      if (res.success) setResults(res.data.results || []);
    });
  }, [adminService]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Results</h2>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Student</th>
            <th className="border px-4 py-2">Exam</th>
            <th className="border px-4 py-2">Score</th>
            <th className="border px-4 py-2">Grade</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 && (
            <tr>
              <td className="border px-4 py-2" colSpan={4}>
                No results found.
              </td>
            </tr>
          )}
          {results.map((result) => (
            <tr key={result._id}>
              <td className="border px-4 py-2">{result.student || "-"}</td>
              <td className="border px-4 py-2">{result.exam || "-"}</td>
              <td className="border px-4 py-2">{result.score}</td>
              <td className="border px-4 py-2">{result.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminResults;
