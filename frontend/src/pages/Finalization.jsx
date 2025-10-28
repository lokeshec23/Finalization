import React, { useState } from "react";
import Header from "../components/Header";
import { Box, TextField, Button, Paper, Typography } from "@mui/material";
import axios from "axios";

const Finalization = () => {
  const [docName, setDocName] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const ext = uploadedFile.name.split(".").pop().toLowerCase();
    if (ext !== "json") {
      alert("Only JSON files are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw_json = JSON.parse(event.target.result);
        const username = localStorage.getItem("username");
        const email = localStorage.getItem("email");

        const payload = {
          username,
          email,
          finalization_document_name: docName,
          raw_json,
        };

        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/upload_json`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        alert(res.data.message || "File saved ok!");
        setFile(uploadedFile);
      } catch (err) {
        console.error(err);
        alert("Invalid JSON or upload failed.");
      }
    };

    reader.readAsText(uploadedFile);
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
          >
            Upload JSON File
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Finalization;
