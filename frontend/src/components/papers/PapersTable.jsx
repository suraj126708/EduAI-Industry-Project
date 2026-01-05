import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import React from "react";

const getStatusColor = (status) => {
  const statusColors = {
    draft: "default",
    published: "success",
    archived: "warning",
  };
  return statusColors[status] || "default";
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return "-";
  }
};

export const PapersTable = ({ papers, onView }) => {
  if (!papers || papers.length === 0) return null;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                Subject
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                Class
              </Typography>
            </TableCell>
            <TableCell align="center">
              <Typography variant="subtitle2" fontWeight={600}>
                Sets
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                Status
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                Created
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight={600}>
                Actions
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {papers.map((group) => (
            <TableRow
              key={group.id}
              hover
              sx={{
                "&:hover": {
                  bgcolor: "action.hover",
                  cursor: "pointer",
                },
              }}
            >
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {group.subject || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {group.classGrade || "N/A"}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={group.count}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={group.status || "draft"}
                  color={getStatusColor(group.status)}
                  size="small"
                  sx={{ textTransform: "capitalize" }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(group.createdAt)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => onView(group)}
                  sx={{ textTransform: "none" }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
