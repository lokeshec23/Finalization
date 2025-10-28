import React, { useState } from "react";
import Header from "../components/Header";
import { Box, TextField, Button, Paper, Typography } from "@mui/material";
import axios from "axios";
import { API } from "../api/auth";

const Finalization = () => {
  const [docName, setDocName] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "json") {
      alert("Only JSON files are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const raw_json = JSON.parse(text); // may throw if invalid

        const username = localStorage.getItem("username") || "";
        const email = localStorage.getItem("email") || "";

        const payload = {
          username,
          email,
          finalization_document_name: docName,
          raw_json,
        };

        setUploading(true);
        const res = await axios.post(`${API}/upload_json`, payload, {
          headers: {
            "Content-Type": "application/json",
            // include token header if your backend needs auth:
            // Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 15000,
        });

        alert(res.data?.message || "File saved ok!");
      } catch (err) {
        console.error("Upload error:", err);
        alert("Invalid JSON or upload failed. Check console for details.");
      } finally {
        setUploading(false);
      }
    };

    reader.readAsText(file);
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
