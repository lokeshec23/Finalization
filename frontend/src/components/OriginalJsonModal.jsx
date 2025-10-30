import React, { useState, useMemo, useEffect, useRef } from "react";
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
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const OriginalJsonModal = ({ open, onClose, jsonData, filename, category }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const contentRef = useRef(null);

  // Format JSON
  const formattedJson = useMemo(() => {
    if (!jsonData) return "";
    return JSON.stringify(jsonData, null, 2);
  }, [jsonData]);

  // Find all matches and their positions
  const matches = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") return [];

    const regex = new RegExp(
      searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi"
    );
    const foundMatches = [];
    let match;

    while ((match = regex.exec(formattedJson)) !== null) {
      foundMatches.push({
        index: match.index,
        text: match[0],
      });
    }

    return foundMatches;
  }, [formattedJson, searchTerm]);

  // Update total matches count
  useEffect(() => {
    setTotalMatches(matches.length);
    if (matches.length > 0 && currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(0);
    } else if (matches.length === 0) {
      setCurrentMatchIndex(0);
    }
  }, [matches, currentMatchIndex]);

  // Highlight JSON with matches
  const highlightedJson = useMemo(() => {
    if (!searchTerm || matches.length === 0) return formattedJson;

    let result = "";
    let lastIndex = 0;

    matches.forEach((match, idx) => {
      // Add text before match
      result += formattedJson.substring(lastIndex, match.index);

      // Add highlighted match
      const isCurrentMatch = idx === currentMatchIndex;
      result += `<mark id="match-${idx}" style="background-color: ${
        isCurrentMatch ? "#ff9800" : "#ffeb3b"
      }; color: ${isCurrentMatch ? "white" : "black"}; font-weight: ${
        isCurrentMatch ? "bold" : "normal"
      }; padding: 2px 0; border-radius: 2px;">${match.text}</mark>`;

      lastIndex = match.index + match.text.length;
    });

    // Add remaining text
    result += formattedJson.substring(lastIndex);

    return result;
  }, [formattedJson, searchTerm, matches, currentMatchIndex]);

  // Scroll to current match
  useEffect(() => {
    if (matches.length > 0 && contentRef.current) {
      const matchElement = contentRef.current.querySelector(
        `#match-${currentMatchIndex}`
      );
      if (matchElement) {
        matchElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [currentMatchIndex, matches.length]);

  // Navigate to next match
  const handleNextMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
    }
  };

  // Navigate to previous match
  const handlePrevMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex(
        (prev) => (prev - 1 + matches.length) % matches.length
      );
    }
  };

  // Handle Enter key to go to next match
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevMatch();
      } else {
        handleNextMatch();
      }
    }
  };

  // Reset search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setCurrentMatchIndex(0);
      setTotalMatches(0);
    }
  }, [open]);

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search in JSON... (Press Enter for next, Shift+Enter for previous)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentMatchIndex(0);
            }}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {/* Match Counter */}
                    {totalMatches > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          bgcolor: "#e3f2fd",
                          borderRadius: 1,
                          fontWeight: 600,
                          color: "#0f62fe",
                          minWidth: "60px",
                          textAlign: "center",
                        }}
                      >
                        {currentMatchIndex + 1} of {totalMatches}
                      </Typography>
                    )}

                    {totalMatches === 0 && searchTerm && (
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          bgcolor: "#ffebee",
                          borderRadius: 1,
                          fontWeight: 600,
                          color: "#d32f2f",
                        }}
                      >
                        No matches
                      </Typography>
                    )}

                    {/* Navigation Buttons */}
                    <IconButton
                      size="small"
                      onClick={handlePrevMatch}
                      disabled={totalMatches === 0}
                      sx={{
                        "&:hover": {
                          bgcolor: "#e3f2fd",
                        },
                      }}
                    >
                      <KeyboardArrowUpIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleNextMatch}
                      disabled={totalMatches === 0}
                      sx={{
                        "&:hover": {
                          bgcolor: "#e3f2fd",
                        },
                      }}
                    >
                      <KeyboardArrowDownIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: "white",
              borderRadius: 1,
            }}
          />
        </Box>
      </Box>

      {/* JSON Content */}
      <DialogContent
        ref={contentRef}
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
