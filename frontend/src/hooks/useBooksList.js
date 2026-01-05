import React, { useState, useCallback } from "react";
import { bookAPI } from "../utils/api";

export const useBooksList = () => {
  const [books, setBooks] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  const fetchBooksMetadata = useCallback(async () => {
    setFetchLoading(true);
    setFetchError(null);
    setBooks([]);
    try {
      const response = await bookAPI.getMyBooks();
      if (response.success) {
        setBooks(response.data || []);
      } else {
        setFetchError("Failed to fetch books.");
      }
    } catch (error) {
      setFetchError(error.response?.data?.message || "Failed to fetch books.");
    } finally {
      setFetchLoading(false);
    }
  }, []);

  const deleteBook = useCallback(async (bookId) => {
    try {
      const resp = await bookAPI.deleteBook(bookId);
      if (resp?.success) {
        setBooks((prev) => prev.filter((b) => b._id !== bookId));
        return { success: true };
      }
      return { success: false, message: resp?.message || "Failed to delete book" };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to delete";
      return { success: false, message: msg };
    }
  }, []);

  return {
    books,
    fetchError,
    fetchLoading,
    fetchBooksMetadata,
    deleteBook,
  };
};

