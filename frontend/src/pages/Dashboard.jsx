import React from "react";
import Header from "../components/Header";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const rows = []; // empty for now

  return (
    <Box>
      <Header />
      <Box sx={{ p: 3 }}>
        {/* Button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            variant="contained"
            sx={{
              bgcolor: "#0f62fe",
              textTransform: "none",
              fontWeight: 500,
              borderRadius: "8px",
            }}
            onClick={() => navigate("/finalization")}
          >
            Uploaded Finalization
          </Button>
        </Box>

        {/* Empty Table */}
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: "#f4f4f4" }}>
              <TableRow>
                <TableCell>S.No</TableCell>
                <TableCell>File Name</TableCell>
                <TableCell>Uploaded By</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{row.fileName}</TableCell>
                    <TableCell>{row.uploadedBy}</TableCell>
                    <TableCell align="center">
                      <Button size="small">View</Button>
                      <Button size="small" color="error">
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default Dashboard;
