import React, { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import DraggableModal from "./DraggableModal";

const NoteExtractionStatusModal = ({ open, onClose, data }) => {
  const [viewMode, setViewMode] = useState("table");
  const [autoWidth, setAutoWidth] = useState(true);

  // Filter Note_Extraction objects where status contains "Note - Final"
  const finalNotes = useMemo(() => {
    if (!data || !data.finalisation || !data.finalisation.Note_Extraction) {
      return [];
    }

    return data.finalisation.Note_Extraction.filter(
      (item) => item.status && item.status.includes("Note - Final")
    );
  }, [data]);

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

    return String(value)
      .replace(/�/g, "–")
      .replace(/â€"/g, "–")
      .replace(/â€"/g, "—")
      .replace(/â€™/g, "'")
      .replace(/Â/g, "");
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  return (
    <DraggableModal
      open={open}
      onClose={onClose}
      title="Note Extraction Status - Final"
      minWidth={500}
      maxWidth="90vw"
      initialWidth={autoWidth ? "auto" : 800}
    >
      <Box sx={{ p: 3 }}>
        {/* Header Controls */}
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Chip
            label={`${finalNotes.length} Final Note${
              finalNotes.length !== 1 ? "s" : ""
            }`}
            color="primary"
            size="small"
          />

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="compact" aria-label="compact view">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {finalNotes.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Final Notes Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No records with status "Note - Final" found in Note Extraction
            </Typography>
          </Box>
        ) : (
          <Box>
            {viewMode === "table" ? (
              // Table View
              finalNotes.map((note, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      bgcolor: "#f5f5f5",
                      p: 1.5,
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      Note {index + 1} - {note.filename || "Untitled"}
                    </span>
                    <Chip
                      label="Final"
                      color="success"
                      size="small"
                      sx={{ height: 20 }}
                    />
                  </Typography>

                  <TableContainer
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      width: "100%",
                    }}
                  >
                    <Table size="small" sx={{ tableLayout: "auto" }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              width: "35%",
                              minWidth: 150,
                            }}
                          >
                            Field
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(note)
                          .filter(([key]) => !key.startsWith("_"))
                          .map(([key, value]) => (
                            <TableRow key={key} hover>
                              <TableCell
                                sx={{
                                  fontWeight: 500,
                                  color: "#616161",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {formatKey(key)}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: "#424242",
                                  fontSize: "0.85rem",
                                  wordBreak: "break-word",
                                  maxWidth: 400,
                                }}
                              >
                                {key === "status" ? (
                                  <Chip
                                    label={formatValue(value)}
                                    color="success"
                                    size="small"
                                    sx={{ fontWeight: 500 }}
                                  />
                                ) : (
                                  formatValue(value)
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))
            ) : (
              // Compact View
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 2,
                }}
              >
                {finalNotes.map((note, index) => (
                  <Box
                    key={index}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      p: 2,
                      bgcolor: "#fafafa",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1, color: "#0f62fe" }}
                    >
                      Note {index + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>File:</strong> {note.filename || "N/A"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Borrower:</strong> {note.borrower_name_1 || "N/A"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Amount:</strong> ${note.loan_amount || "0"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Property:</strong>{" "}
                      {note.property_address || "N/A"}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={note.status}
                        color="success"
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </DraggableModal>
  );
};

export default NoteExtractionStatusModal;
