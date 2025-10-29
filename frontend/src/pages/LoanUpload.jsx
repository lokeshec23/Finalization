import React, { useState } from "react";
import Header from "../components/Header";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const LoanUpload = () => {
  const navigate = useNavigate();
  const [loanId, setLoanId] = useState("");
  const [inputFiles, setInputFiles] = useState([]);
  const [outputFile, setOutputFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleInputFolderSelect = (e) => {
    const files = Array.from(e.target.files);
    setInputFiles(files);

    // Auto-extract loan_id from first file path if not set
    if (!loanId && files.length > 0) {
      const path = files[0].webkitRelativePath;
      const parts = path.split("/");
      if (parts.length >= 2) {
        setLoanId(parts[1]); // Get folder name
      }
    }
  };

  const handleOutputFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".json")) {
      setOutputFile(file);

      // Extract loan_id from filename (remove _final.json)
      if (!loanId) {
        const extractedId = file.name.replace("_final.json", "");
        setLoanId(extractedId);
      }
    } else {
      alert("Please select a valid JSON file");
    }
  };

  const handleUpload = async () => {
    if (!loanId.trim()) {
      alert("Please enter a loan ID");
      return;
    }

    if (inputFiles.length === 0) {
      alert("Please select input folder");
      return;
    }

    if (!outputFile) {
      alert("Please select output file");
      return;
    }

    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    if (!username || !email) {
      alert("User credentials not found. Please login again.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("loan_id", loanId.trim());

      // Add all input files with their paths
      inputFiles.forEach((file) => {
        formData.append(
          "input_files",
          file,
          file.webkitRelativePath || file.name
        );
      });

      // Add output file
      formData.append("output_file", outputFile);

      setUploadProgress(30);

      const res = await axios.post(
        "http://127.0.0.1:8000/upload_loan_folder",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      console.log("✅ Upload success:", res.data);
      alert(`Loan ${loanId} uploaded successfully!`);

      // Reset form
      setLoanId("");
      setInputFiles([]);
      setOutputFile(null);
      document.getElementById("input-folder").value = "";
      document.getElementById("output-file").value = "";

      // Navigate to dashboard or loan view
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Upload failed:", err);
      const errorMsg =
        err.response?.data?.detail || "Upload failed. Check console.";
      alert(errorMsg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Group files by category
  const filesByCategory = inputFiles.reduce((acc, file) => {
    const path = file.webkitRelativePath || file.name;
    const parts = path.split("/");
    const category = parts.length >= 3 ? parts[2] : "Uncategorized";

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(file.name);
    return acc;
  }, {});

  return (
    <Box>
      <Header />
      <Box sx={{ p: 4, maxWidth: 800, margin: "0 auto" }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
          Upload Loan Folder
        </Typography>

        <Paper sx={{ p: 4 }}>
          {/* Loan ID */}
          <TextField
            label="Loan ID"
            fullWidth
            margin="normal"
            value={loanId}
            onChange={(e) => setLoanId(e.target.value)}
            placeholder="0IHMM8WJYSQHRL1CFJDN5ATV_02Jul2025_110945"
            helperText="Auto-extracted from folder/file name or enter manually"
          />

          {/* Input Folder Selection */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              1. Select Input Folder
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<FolderOpenIcon />}
              sx={{ textTransform: "none", py: 2 }}
            >
              {inputFiles.length > 0
                ? `${inputFiles.length} files selected`
                : "Choose Input Folder"}
              <input
                id="input-folder"
                type="file"
                hidden
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleInputFolderSelect}
              />
            </Button>

            {/* Show selected files by category */}
            {inputFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Selected {inputFiles.length} files from{" "}
                  {Object.keys(filesByCategory).length} categories
                </Alert>
                <List
                  dense
                  sx={{
                    maxHeight: 200,
                    overflow: "auto",
                    bgcolor: "#f5f5f5",
                    borderRadius: 1,
                  }}
                >
                  {Object.entries(filesByCategory).map(([category, files]) => (
                    <ListItem key={category}>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={category}
                              size="small"
                              color="primary"
                            />
                            <Typography variant="body2">
                              {files.length} files
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>

          {/* Output File Selection */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              2. Select Output File (final.json)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<FolderOpenIcon />}
              sx={{ textTransform: "none", py: 2 }}
            >
              {outputFile ? outputFile.name : "Choose Output File"}
              <input
                id="output-file"
                type="file"
                hidden
                accept=".json"
                onChange={handleOutputFileSelect}
              />
            </Button>
          </Box>

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}

          {/* Upload Button */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<CloudUploadIcon />}
            onClick={handleUpload}
            disabled={
              uploading || !loanId || inputFiles.length === 0 || !outputFile
            }
            sx={{
              mt: 3,
              bgcolor: "#0f62fe",
              textTransform: "none",
              py: 1.5,
            }}
          >
            {uploading ? "Uploading..." : "Upload Loan Folder"}
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => navigate("/dashboard")}
            sx={{ mt: 1, textTransform: "none" }}
          >
            Cancel
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default LoanUpload;
