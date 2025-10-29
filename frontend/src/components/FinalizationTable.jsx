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

const FinalizationTable = ({
  data,
  title,
  categoryName,
  isDynamic = false,
}) => {
  if (!data || data.length === 0) {
    return (
      <Paper
        elevation={3}
        sx={{
          mb: isDynamic ? 0 : 2,
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          height: isDynamic ? "100%" : "auto",
          display: isDynamic ? "flex" : "block",
          flexDirection: isDynamic ? "column" : "initial",
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
        <Box
          sx={{ textAlign: "center", py: 3, flex: isDynamic ? 1 : "initial" }}
        >
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
        mb: isDynamic ? 0 : 2,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        overflow: "hidden",
        height: isDynamic ? "100%" : "auto",
        display: isDynamic ? "flex" : "block",
        flexDirection: isDynamic ? "column" : "initial",
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
          flexShrink: 0,
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

      {/* Table Content - Full Horizontal Scroll */}
      <TableContainer
        sx={{
          maxHeight: isDynamic ? "100%" : "450px",
          flex: isDynamic ? 1 : "initial",
          overflowY: "auto",
          overflowX: "auto",
          width: "100%",
          "&::-webkit-scrollbar": {
            width: "10px",
            height: "10px",
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
        <Table
          stickyHeader
          size="small"
          sx={{ width: "max-content", minWidth: "100%" }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                align="left"
                sx={{
                  fontWeight: 700,
                  bgcolor: "#f8f9fa",
                  borderBottom: "2px solid #0f62fe",
                  width: "60px",
                  py: 1,
                  px: 1.5,
                  fontSize: "0.75rem",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  whiteSpace: "nowrap",
                }}
              >
                S.No
              </TableCell>
              {headers.map((header) => (
                <TableCell
                  key={header}
                  align="left"
                  sx={{
                    fontWeight: 700,
                    bgcolor: "#f8f9fa",
                    borderBottom: "2px solid #0f62fe",
                    py: 1,
                    px: 1.5,
                    fontSize: "0.75rem",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    whiteSpace: "nowrap",
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
                  align="left"
                  sx={{
                    fontWeight: 600,
                    color: "#0f62fe",
                    py: 1.5,
                    px: 2,
                    fontSize: "0.8rem",
                    borderRight: "1px solid #e0e0e0",
                    whiteSpace: "nowrap",
                  }}
                >
                  {index + 1}
                </TableCell>
                {headers.map((header) => (
                  <TableCell
                    key={header}
                    align="left"
                    sx={{
                      fontSize: "0.8rem",
                      py: 1.5,
                      px: 2,
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
