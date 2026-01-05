import React, { useCallback } from "react";
import { auth } from "../firebase/firebase";

export const useBookUploadSSE = ({ documentRows, setDocumentRows, uniqueClasses, schoolId, setUploadResults, setIsUploading }) => {
  const uploadBooks = useCallback(async () => {
    if (!schoolId) {
      throw new Error("Cannot upload: School information is missing.");
    }

    const validRows = documentRows.filter(
      (r) => r.class && r.subject && r.file && !r.error && r.status === "pending"
    );
    if (validRows.length === 0) return;

    setIsUploading(true);
    setUploadResults([]);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in.");
    }

    const idToken = await currentUser.getIdToken();

    const updateRow = (rowId, key, value) => {
      setDocumentRows((rows) =>
        rows.map((r) => (r.id === rowId ? { ...r, [key]: value } : r))
      );
    };

    const promises = validRows.map(async (row) => {
      updateRow(row.id, "status", "uploading");
      updateRow(row.id, "progress", 0);
      updateRow(row.id, "progressMessage", "Uploading Book...");

      const progressId = `${currentUser.uid}_${Date.now()}_${row.file.name.replace(/\s/g, "_")}`;
      const formData = new FormData();
      const selectedClassObj = uniqueClasses.find((c) => c.value === row.class);
      const selectedSubjectObj = row.filteredSubjects.find(
        (s) => s.value === row.subject
      );

      if (!selectedClassObj || !selectedSubjectObj) {
        updateRow(row.id, "status", "error");
        updateRow(row.id, "error", "Selection mismatch");
        return { success: false, filename: row.file?.name, error: "Mismatch" };
      }

      formData.append("pdf", row.file);
      formData.append("classId", String(selectedClassObj.grade));
      formData.append("subject", selectedSubjectObj.name);
      formData.append("schoolId", schoolId);
      formData.append("title", selectedSubjectObj.label);
      formData.append("author", "System");
      formData.append("year", new Date().getFullYear());
      formData.append("teacherId", currentUser.uid);
      formData.append("progressId", progressId);

      return new Promise(async (resolve) => {
        try {
          const apiUrl = `http://localhost:5001/api/teachers/upload-book?sse=true`;
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { Authorization: `Bearer ${idToken}` },
            body: formData,
          });

          if (
            !response.ok &&
            !response.headers.get("content-type")?.includes("text/event-stream")
          ) {
            const errorData = await response.json();
            updateRow(row.id, "status", "error");
            updateRow(row.id, "error", errorData.message || "Upload failed");
            updateRow(row.id, "progress", 0);
            resolve({
              success: false,
              filename: row.file.name,
              error: errorData.message || "Upload failed",
            });
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.substring(6));

                  if (data.progress !== undefined) {
                    updateRow(row.id, "progress", data.progress);
                    if (data.message) updateRow(row.id, "progressMessage", data.message);
                    if (data.stage) updateRow(row.id, "status", data.stage);
                  }

                  if (data.error || data.stage === "error") {
                    updateRow(row.id, "status", "error");
                    updateRow(row.id, "error", data.message || data.error || "Upload failed");
                    updateRow(row.id, "progress", 0);
                    resolve({
                      success: false,
                      filename: row.file.name,
                      error: data.message || data.error || "Upload failed",
                    });
                    return;
                  }

                  if (data.progress >= 100 || data.success) {
                    updateRow(row.id, "status", "processed");
                    updateRow(row.id, "progress", 100);
                    updateRow(row.id, "progressMessage", "Upload Complete! Redirecting...");
                    resolve({
                      success: true,
                      filename: row.file.name,
                      chunks: data.data?.noOfChunks,
                      status: data.data?.processedStatus,
                    });
                    return;
                  }
                } catch (e) {
                  console.warn("[FRONTEND] Failed to parse SSE data:", e);
                }
              }
            }
          }
        } catch (err) {
          console.error("Upload error:", err);
          const errorMessage =
            err.response?.data?.message || err.message || "Unknown error.";
          updateRow(row.id, "status", "error");
          updateRow(row.id, "error", errorMessage);
          updateRow(row.id, "progress", 0);
          resolve({
            success: false,
            filename: row.file.name,
            error: errorMessage,
          });
        }
      });
    });

    const results = await Promise.all(promises);
    const finalResults = results.filter(
      (res) => res.error !== "Duplicate entry. User was notified."
    );

    setUploadResults(finalResults);
    setIsUploading(false);
    return finalResults;
  }, [documentRows, uniqueClasses, schoolId, setDocumentRows, setUploadResults, setIsUploading]);

  return { uploadBooks };
};

