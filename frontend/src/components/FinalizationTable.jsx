import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from "@mui/material";

const FinalizationTable = ({ data, title, categoryName }) => {
  if (!data || data.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No data available
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Get all unique keys from all objects, excluding document_type and docId
  const allKeys = new Set();
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== "document_type" && key !== "docId" && !key.startsWith("_")) {
        allKeys.add(key);
      }
    });
  });

  const headers = Array.from(allKeys);

  const formatKey = (key) => {
    return key
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "—";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    // Clean special characters
    return String(value)
      .replace(/�/g, "–")
      .replace(/â€"/g, "–")
      .replace(/â€"/g, "—")
      .replace(/â€™/g, "'")
      .replace(/Â/g, "");
  };

  return (
    <Paper elevation={2} sx={{ mb: 3, overflow: "hidden" }}>
      {/* Table Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: "#0f62fe",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {data.length} record{data.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      {/* Table Content */}
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 700,
                  bgcolor: "#f4f4f4",
                  borderBottom: "2px solid #e0e0e0",
                  width: "60px",
                }}
              >
                S.No
              </TableCell>
              {headers.map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontWeight: 700,
                    bgcolor: "#f4f4f4",
                    borderBottom: "2px solid #e0e0e0",
                    minWidth: 150,
                  }}
                >
                  {formatKey(header)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell sx={{ fontWeight: 600, color: "#616161" }}>
                  {index + 1}
                </TableCell>
                {headers.map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      fontSize: "0.875rem",
                      maxWidth: 300,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatValue(row[header])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default FinalizationTable;
