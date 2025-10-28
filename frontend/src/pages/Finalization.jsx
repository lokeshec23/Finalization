import React, { useState } from "react";
import Header from "../components/Header";
import { Box, TextField, Button, Paper, Typography } from "@mui/material";
import axios from "axios";

const Finalization = () => {
  const [docName, setDocName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    // Validate JSON file
    if (!file.name.endsWith(".json")) {
      alert("Only JSON files are allowed!");
      e.target.value = ""; // Clear input
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    if (!docName.trim()) {
      alert("Please enter a document name");
      return;
    }

    if (!username || !email) {
      alert("User credentials not found. Please login again.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("finalization_document_name", docName.trim());
    formData.append("json_file", selectedFile);

    console.log(
      "📤 Uploading file:",
      selectedFile.name,
      selectedFile.size,
      "bytes"
    );
    console.log("📋 Form data:");
    for (let pair of formData.entries()) {
      console.log(`  ${pair[0]}:`, pair[1]);
    }

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/upload_json",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Upload success:", res.data);
      alert(`File saved successfully! ID: ${res.data.inserted_id}`);

      // Reset form
      setDocName("");
      setSelectedFile(null);
      // Reset file input
      document.getElementById("file-input").value = "";
    } catch (err) {
      console.error("❌ Upload failed:", err);
      const errorMsg =
        err.response?.data?.detail ||
        "Upload failed. Check console for details.";
      alert(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Header />
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <Paper sx={{ p: 4, width: 400 }}>
          <Typography variant="h6" mb={2}>
            Upload Finalization Document
          </Typography>

          <TextField
            label="Finalization Document Name"
            fullWidth
            margin="normal"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
          />

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 2, textTransform: "none" }}
          >
            {selectedFile ? selectedFile.name : "Choose JSON File"}
            <input
              id="file-input"
              type="file"
              hidden
              accept=".json,application/json"
              onChange={handleFileSelect}
            />
          </Button>

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2, bgcolor: "#0f62fe", textTransform: "none" }}
            disabled={uploading || !selectedFile}
            onClick={handleUpload}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Finalization;
