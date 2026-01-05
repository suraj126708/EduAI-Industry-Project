import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Fade,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import SearchIcon from "@mui/icons-material/Search";
import { useBookUpload } from "../hooks/useBookUpload";
import { useBookUploadSSE } from "../hooks/useBookUploadSSE";
import { useBooksList } from "../hooks/useBooksList";
import {
  DocumentRow,
  BooksTable,
  UploadSummary,
} from "../components/bookUpload";

const BookUpload = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const {
    documentRows,
    setDocumentRows,
    isUploading,
    setIsUploading,
    uploadResults,
    setUploadResults,
    schoolId,
    isProfileLoading,
    profileError,
    uniqueClasses,
    assignmentsLoading,
    assignmentsError,
    updateRow,
    addNewRow,
    removeRow,
    resetRow,
    clearProcessedRows,
  } = useBookUpload();

  const { uploadBooks } = useBookUploadSSE({
    documentRows,
    setDocumentRows,
    uniqueClasses,
    schoolId,
    setUploadResults,
    setIsUploading,
  });

  const { books, fetchError, fetchLoading, fetchBooksMetadata, deleteBook } =
    useBooksList();

  useEffect(() => {
    if (activeTab === 1) {
      fetchBooksMetadata();
    }
  }, [activeTab, fetchBooksMetadata]);

  const handleFileSelect = (id, files) => {
    const file = files && files[0];
    if (!file) return;
    resetRow(id);
    if (!file.type.includes("pdf")) {
      updateRow(id, "error", "Invalid file type. Please select a PDF.");
      return;
    }
    updateRow(id, "error", null);
    updateRow(id, "file", file);
  };

  const handleUpload = async () => {
    try {
      const results = await uploadBooks();
      const hasSuccessfulUploads = results?.some((res) => res.success);
      if (hasSuccessfulUploads && activeTab === 1) {
        fetchBooksMetadata();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "Upload failed",
        severity: "error",
      });
    }
  };

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;
    const result = await deleteBook(bookToDelete._id);
    setSnackbar({
      open: true,
      message: result.success
        ? "Book deleted successfully"
        : result.message || "Failed to delete book",
      severity: result.success ? "success" : "error",
    });
    setDeleteDialogOpen(false);
    setBookToDelete(null);
  };

  const hasPendingRows = useMemo(
    () =>
      documentRows.some(
        (r) => r.class && r.subject && r.file && r.status === "pending"
      ),
    [documentRows]
  );

  const hasProcessedRows = useMemo(
    () => documentRows.some((r) => r.status === "processed"),
    [documentRows]
  );

  const pendingCount = useMemo(
    () => documentRows.filter((r) => r.status === "pending" && r.file).length,
    [documentRows]
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            p: 3,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            Book Management
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Upload and manage educational materials for the platform.
          </Typography>
        </Box>

        <Box
          sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "grey.50" }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ px: 2 }}
          >
            <Tab
              icon={<UploadIcon />}
              iconPosition="start"
              label="Upload Books"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              icon={<SearchIcon />}
              iconPosition="start"
              label="Find Books"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <Fade in={activeTab === 0} timeout={300}>
            <Box sx={{ display: activeTab === 0 ? "block" : "none" }}>
              {isProfileLoading || assignmentsLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 8,
                  }}
                >
                  <CircularProgress size={48} />
                  <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                    Loading Information...
                  </Typography>
                </Box>
              ) : profileError || assignmentsError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Error Loading Data
                  </Typography>
                  <Typography variant="body2">
                    {profileError || assignmentsError}
                  </Typography>
                </Alert>
              ) : (
                <>
                  <Box sx={{ mb: 3 }}>
                    {documentRows.map((row) => (
                      <DocumentRow
                        key={row.id}
                        row={row}
                        uniqueClasses={uniqueClasses}
                        onUpdate={updateRow}
                        onRemove={removeRow}
                        onFileSelect={handleFileSelect}
                        onReset={resetRow}
                        canRemove={documentRows.length > 1}
                        isUploading={isUploading}
                      />
                    ))}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    <Button
                      startIcon={<AddIcon />}
                      onClick={addNewRow}
                      disabled={isUploading}
                      variant="outlined"
                      color="primary"
                    >
                      Add Another
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={!hasPendingRows || isUploading}
                      onClick={handleUpload}
                      startIcon={
                        isUploading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <UploadIcon />
                        )
                      }
                    >
                      {isUploading
                        ? "Processing..."
                        : `Upload ${pendingCount} File(s)`}
                    </Button>
                    {hasProcessedRows && (
                      <Button
                        onClick={clearProcessedRows}
                        disabled={isUploading}
                        variant="text"
                        color="inherit"
                      >
                        Clear Processed
                      </Button>
                    )}
                  </Box>

                  <UploadSummary results={uploadResults} />
                </>
              )}
            </Box>
          </Fade>

          <Fade in={activeTab === 1} timeout={300}>
            <Box sx={{ display: activeTab === 1 ? "block" : "none" }}>
              {fetchError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {fetchError}
                </Alert>
              )}
              <BooksTable
                books={books}
                loading={fetchLoading}
                onDelete={handleDeleteClick}
              />
            </Box>
          </Fade>
        </Box>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Book</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this book? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BookUpload;
