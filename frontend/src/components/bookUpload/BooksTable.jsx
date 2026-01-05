import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { StatusBadge } from "./StatusBadge";
import React from "react";

export const BooksTable = ({ books, loading, onDelete }) => {
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (books.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 10,
          px: 4,
          border: 2,
          borderStyle: "dashed",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <MenuBookIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" fontWeight={500} gutterBottom>
          No Books Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You haven't uploaded any books yet.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Subject</TableCell>
            <TableCell>Class</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Chunks</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {books.map((book) => (
            <TableRow
              key={book._id}
              hover
              sx={{ "&:hover": { bgcolor: "action.hover" } }}
            >
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {book.title}
                </Typography>
              </TableCell>
              <TableCell>
                {book.classId ? `Class ${book.classId.grade}` : "N/A"}
              </TableCell>
              <TableCell>
                <StatusBadge status={book.processedStatus} />
              </TableCell>
              <TableCell>{book.noOfChunks ?? "-"}</TableCell>
              <TableCell align="right">
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => onDelete(book)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
