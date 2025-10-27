import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext"; // Adjust path if needed
import { Loader2, AlertCircle, BookOpen } from "lucide-react";

const AdminBooks = () => {
  const { adminService } = useAuth(); // Assuming adminService has getBooksByClass
  const [groupedBooks, setGroupedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      // Ensure the service method exists
      if (!adminService || !adminService.getBooksByClass) {
        setError("Book service is not available in adminService.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const res = await adminService.getBooksByClass(); // Call the new API endpoint
        if (res.success) {
          setGroupedBooks(res.data || []);
        } else {
          setError(res.message || "Failed to fetch books.");
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching books.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [adminService]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2">Loading books...</span>
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
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6" /> Book Management
      </h2>

      {groupedBooks.length === 0 ? (
        <p className="text-gray-500">No books have been uploaded yet.</p>
      ) : (
        <div className="space-y-6">
          {groupedBooks.map((classGroup) => (
            <div
              key={classGroup.classId}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
            >
              <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b border-gray-200">
                Class {classGroup.classGrade || "Unknown"}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded On
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classGroup.books.map((book) => (
                      <tr key={book._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {book.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {book.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {book.author}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {book.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {book.uploadedBy?.name || "N/A"}
                          {book.uploadedBy?.email && (
                            <div className="text-xs text-gray-500">
                              {book.uploadedBy.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(book.uploadedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBooks;
