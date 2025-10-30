import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";

const OriginalJsonModal = ({ open, onClose, jsonData, filename, category }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Format JSON with syntax highlighting
  const formattedJson = useMemo(() => {
    if (!jsonData) return "";
    return JSON.stringify(jsonData, null, 2);
  }, [jsonData]);

  // Highlight search term in JSON
  const highlightedJson = useMemo(() => {
    if (!searchTerm) return formattedJson;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    return formattedJson.replace(
      regex,
      '<mark style="background-color: #ffeb3b; font-weight: bold;">$1</mark>'
    );
  }, [formattedJson, searchTerm]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    alert("JSON copied to clipboard!");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: "90vh",
          borderRadius: 2,
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: "#0f62fe",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Original JSON - {filename}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Category: {category}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Search Bar */}
      <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search in JSON..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: "white",
            borderRadius: 1,
          }}
        />
      </Box>

      {/* JSON Content */}
      <DialogContent
        sx={{
          p: 0,
          bgcolor: "#1e1e1e",
          overflow: "auto",
        }}
      >
        {jsonData ? (
          <Box
            component="pre"
            sx={{
              p: 3,
              m: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: "0.875rem",
              color: "#d4d4d4",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{ __html: highlightedJson }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography color="text.secondary">
              No JSON data available
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
        <Button onClick={handleCopy} variant="outlined">
          Copy JSON
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ bgcolor: "#0f62fe" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OriginalJsonModal;
