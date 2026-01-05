import React, { useState, useEffect, useCallback } from "react";
import { paperAPI } from "../utils/api";

export const usePapers = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupedPapers, setGroupedPapers] = useState([]);

  const fetchPapers = useCallback(async () => {
    let mounted = true;
    setLoading(true);
    setError("");

    try {
      const res = await paperAPI.getMyPapers();
      if (!mounted) return;

      if (res?.success) {
        const papers = res.data || [];

        const groups = papers.reduce((acc, paper) => {
          const creationDate = new Date(paper.createdAt);
          creationDate.setSeconds(0, 0);
          const preciseTimestamp = creationDate.toISOString();

          const batchId =
            paper.generationBatchId ||
            `${paper.subject}-${paper.classGrade}-${preciseTimestamp}`;

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

        const groupedArray = Object.values(groups)
          .map((group) => ({
            ...group,
            count: group.papers.length,
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setGroupedPapers(groupedArray);
      } else {
        setError(res?.message || "Failed to fetch papers");
      }
    } catch (e) {
      if (mounted) {
        setError(
          e?.response?.data?.message ||
            "Failed to fetch papers. Please ensure the backend endpoint exists."
        );
      }
    } finally {
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  return {
    loading,
    error,
    groupedPapers,
    refetch: fetchPapers,
  };
};

