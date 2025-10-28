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

const DataTable = ({ data }) => {
  if (!data || typeof data !== "object") {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">No data available</Typography>
      </Box>
    );
  }

  // Filter out internal keys
  const entries = Object.entries(data).filter(
    ([key]) => !key.startsWith("_") && key !== "id"
  );

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
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    // Convert and clean
    return String(value)
      .replace(/�/g, "–")
      .replace(/â€"/g, "–")
      .replace(/â€"/g, "—")
      .replace(/â€™/g, "'")
      .replace(/Â/g, "");
  };

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small" sx={{ minWidth: 400 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f8f9fa" }}>
            <TableCell
              sx={{
                fontWeight: 700,
                width: "40%",
                fontSize: "0.875rem",
                color: "#424242",
              }}
            >
              Field
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "#424242",
              }}
            >
              Value
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map(([key, value]) => (
            <TableRow key={key} hover>
              <TableCell
                sx={{
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  color: "#616161",
                  verticalAlign: "top",
                }}
              >
                {formatKey(key)}
              </TableCell>
              <TableCell
                sx={{
                  fontSize: "0.85rem",
                  color: "#424242",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                {formatValue(value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
