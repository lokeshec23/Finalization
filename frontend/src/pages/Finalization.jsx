import React, { useState } from "react";
import Header from "../components/Header";
import { Box, TextField, Button, Paper, Typography } from "@mui/material";
import axios from "axios";
import { API } from "../api/auth";

const Finalization = () => {
  const [docName, setDocName] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      alert("Please select a file");
      return;
    }

    // Just a name check — safer than relying on MIME
    if (!file.name.endsWith(".json")) {
      alert("Only JSON files are allowed!");
      return;
    }

    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    // FIX: Use docName state instead of non-existent ref
    if (!docName.trim()) {
      alert("Please enter a document name");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("finalization_document_name", docName.trim());
    formData.append("json_file", file);

    console.log("Uploading file:", file.name, file.size, "bytes");

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/upload_json",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert("File saved OK!");
      console.log("Upload success:", res.data);

      // Reset form
      setDocName("");
      e.target.value = ""; // Clear file input
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check console for details.");
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
            variant="contained"
            component="label"
            sx={{ mt: 2, bgcolor: "#0f62fe", textTransform: "none" }}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload JSON File"}
            <input
              type="file"
              hidden
              accept=".json,application/json"
              onChange={handleFileChange}
            />
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Finalization;
