import React, { useState } from "react";
import Header from "../components/Header";
import { Box, TextField, Button, Paper, Typography } from "@mui/material";

const Finalization = () => {
  const [docName, setDocName] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      const ext = uploadedFile.name.split(".").pop().toLowerCase();
      if (ext === "json") {
        setFile(uploadedFile);
        alert("File saved ok!");
      } else {
        alert("Only JSON files are allowed.");
      }
    }
  };

  return (
    <Box>
      <Header />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 5,
        }}
      >
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
            sx={{
              mt: 2,
              bgcolor: "#0f62fe",
              textTransform: "none",
            }}
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
