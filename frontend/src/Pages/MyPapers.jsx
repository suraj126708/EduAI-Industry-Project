import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Fade,
} from "@mui/material";
import { usePapers } from "../hooks/usePapers";
import { PapersTable, EmptyState } from "../components/papers";
import React from "react";

const MyPapers = () => {
  const navigate = useNavigate();
  const { loading, error, groupedPapers } = usePapers();

  const viewPaper = (paperGroup) => {
    try {
      sessionStorage.setItem(
        "paperBatchData",
        JSON.stringify(paperGroup.papers)
      );
      navigate(`/paper/${paperGroup.papers[0]._id}`);
    } catch (e) {
      console.error("Failed to navigate to paper:", e);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            My Question Papers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View and manage your generated question papers
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 8,
              }}
            >
              <CircularProgress size={48} />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Loading your papers...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Error
              </Typography>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}

          {!loading && !error && groupedPapers.length === 0 && <EmptyState />}

          {!loading && !error && groupedPapers.length > 0 && (
            <Fade in timeout={500}>
              <Box>
                <PapersTable papers={groupedPapers} onView={viewPaper} />
              </Box>
            </Fade>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default MyPapers;
