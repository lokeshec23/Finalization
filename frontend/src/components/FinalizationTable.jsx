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
  Chip,
} from "@mui/material";

const FinalizationTable = ({ data, title, categoryName }) => {
  if (!data || data.length === 0) {
    return (
      <Paper
        elevation={3}
        sx={{
          mb: 2,
          border: "1px solid #e0e0e0",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 0.75,
            bgcolor: "#0f62fe",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, fontSize: "0.85rem" }}
          >
            {title}
          </Typography>
          <Chip
            label="0 records"
            size="small"
            sx={{
              bgcolor: "white",
              color: "#0f62fe",
              fontWeight: 700,
              height: 20,
              fontSize: "0.7rem",
            }}
          />
        </Box>
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
    <Paper
      elevation={3}
      sx={{
        mb: 2,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Table Header - Very Compact */}
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          bgcolor: "#0f62fe",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, fontSize: "0.85rem" }}
        >
          {title}
        </Typography>
        <Chip
          label={`${data.length} record${data.length !== 1 ? "s" : ""}`}
          size="small"
          sx={{
            bgcolor: "white",
            color: "#0f62fe",
            fontWeight: 700,
            height: 20,
            fontSize: "0.7rem",
          }}
        />
      </Box>

      {/* Table Content - Scrollable with Sticky Header */}
      <TableContainer
        sx={{
          maxHeight: 450,
          overflowY: "auto",
          overflowX: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            bgcolor: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#888",
            borderRadius: "4px",
            "&:hover": {
              bgcolor: "#555",
            },
          },
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 700,
                  bgcolor: "#f8f9fa",
                  borderBottom: "2px solid #0f62fe",
                  width: "45px",
                  py: 0.5,
                  px: 1,
                  fontSize: "0.75rem",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                S.No
              </TableCell>
              {headers.map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontWeight: 700,
                    bgcolor: "#f8f9fa",
                    borderBottom: "2px solid #0f62fe",
                    minWidth: 130,
                    py: 0.5,
                    px: 1,
                    fontSize: "0.75rem",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  {formatKey(header)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={index}
                hover
                sx={{
                  "&:nth-of-type(odd)": {
                    bgcolor: "#fafafa",
                  },
                  "&:hover": {
                    bgcolor: "#e3f2fd !important",
                  },
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "#0f62fe",
                    py: 0.75,
                    px: 1,
                    fontSize: "0.8rem",
                    borderRight: "1px solid #e0e0e0",
                  }}
                >
                  {index + 1}
                </TableCell>
                {headers.map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      fontSize: "0.8rem",
                      py: 0.75,
                      px: 1,
                      maxWidth: 250,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={formatValue(row[header])} // Tooltip on hover
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
