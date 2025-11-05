import React, { useEffect, useState } from "react";
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
  CircularProgress,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { documentAPI } from "../api/documentAPI";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep"; // for "Delete All"
import axios from "axios"; // to call FastAPI directly

const Dashboard = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [viewLoadingId, setViewLoadingId] = useState(null); // ✅ Changed to track specific document ID

  useEffect(() => {
    fetchDocuments();

    const handleUpload = () => {
      console.log("Document uploaded, refreshing dashboard...");
      fetchDocuments();
    };

    window.addEventListener("documentUploaded", handleUpload);

    return () => {
      window.removeEventListener("documentUploaded", handleUpload);
    };
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const username = localStorage.getItem("username");
      const data = await documentAPI.listDocuments(username);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      showSnackbar("Failed to load documents", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (doc) => {
    try {
      setViewLoadingId(doc._id); // ✅ Set loading for specific document
      const filename = doc.original_filename;
      const username = localStorage.getItem("username");

      if (!filename) {
        showSnackbar("Filename not found", "error");
        return;
      }

      const fetchedDoc = await documentAPI.getDocumentByFilename(
        filename,
        username
      );

      console.log("✅ Fetched document:", fetchedDoc);

      navigate("/finalization", {
        state: {
          viewMode: true,
          fetchedDocument: fetchedDoc,
          documentName: fetchedDoc.finalization_document_name,
          originalFileName: fetchedDoc.original_filename,
          documentId: fetchedDoc._id,
        },
      });
    } catch (error) {
      console.error("Error fetching document:", error);
      showSnackbar("Failed to load document", "error");
    } finally {
      setViewLoadingId(null); // ✅ Clear loading state
    }
  };

  const handleDeleteClick = (doc) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      await documentAPI.deleteDocument(documentToDelete._id);
      showSnackbar("Document deleted successfully", "success");
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      showSnackbar("Failed to delete document", "error");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (doc) => {
    if (doc.upload_date) {
      return new Date(doc.upload_date).toLocaleDateString();
    }
    if (doc._id) {
      return new Date(
        parseInt(doc._id.substring(0, 8), 16) * 1000
      ).toLocaleDateString();
    }
    return "—";
  };

  // ✅ Open the "Delete All" confirmation dialog
  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  // ✅ Confirm delete all
  const handleDeleteAllConfirm = async () => {
    try {
      // ✅ Get the currently selected team from localStorage
      const team = localStorage.getItem("selectedTeam");
      if (!team) {
        showSnackbar(
          "No team selected. Please select a workspace first.",
          "error"
        );
        return;
      }

      // ✅ Pass the team as a query parameter in the DELETE request
      await axios.delete("http://127.0.0.1:8000/delete_all_json", {
        params: { team: team },
      });

      showSnackbar(
        `All documents for the '${team.toUpperCase()}' workspace deleted successfully`,
        "success"
      );
      setDeleteAllDialogOpen(false);
      fetchDocuments(); // refresh table
    } catch (error) {
      console.error("Error deleting all documents:", error);
      showSnackbar(
        error.response?.data?.detail || "Failed to delete all documents",
        "error"
      );
    }
  };

  // ✅ Cancel delete all
  const handleDeleteAllCancel = () => {
    setDeleteAllDialogOpen(false);
  };

  return (
    <Box>
      {/* <Header /> */}
      <Box sx={{ p: 3 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Uploaded Documents
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchDocuments}
              disabled={loading}
              sx={{ textTransform: "none" }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={handleDeleteAllClick}
              disabled={loading || documents.length === 0}
              sx={{
                textTransform: "none",
                borderColor: "#f44336",
                color: "#f44336",
                "&:hover": { bgcolor: "#ffebee", borderColor: "#d32f2f" },
              }}
            >
              Delete All
            </Button>

            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              sx={{
                bgcolor: "#0f62fe",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": {
                  bgcolor: "#0056b3",
                },
              }}
              onClick={() => navigate("/finalization")}
            >
              Upload Finalization
            </Button>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f4f4f4" }}>
                <TableCell sx={{ fontWeight: 700, width: "10%" }}>
                  S.No
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: "50%" }}>
                  File Name
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: "20%" }}>
                  Upload Date
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, width: "20%" }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={30} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading documents...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      No documents found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click "Upload Finalization" to add your first document
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc, index) => (
                  <TableRow key={doc._id} hover>
                    <TableCell>{index + 1}</TableCell>
                    {/* ✅ Made filename clickable */}
                    <TableCell
                      onClick={() => handleView(doc)}
                      sx={{
                        cursor: "pointer",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <InsertDriveFileIcon fontSize="small" color="primary" />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: "#0f62fe",
                            textDecoration: "underline",
                            "&:hover": {
                              color: "#0353e9",
                              textDecoration: "none",
                            },
                          }}
                        >
                          {doc.original_filename.split("_final.json")[0] ||
                            "Unknown.json"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(doc)}</TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <Tooltip title="View Document">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleView(doc)}
                            disabled={viewLoadingId === doc._id} // ✅ Disable only this row
                            sx={{
                              "&:hover": {
                                bgcolor: "#e3f2fd",
                              },
                            }}
                          >
                            {/* ✅ Show loading only for clicked row */}
                            {viewLoadingId === doc._id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <VisibilityIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Document">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(doc)}
                            sx={{
                              "&:hover": {
                                bgcolor: "#ffebee",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: "#f5f5f5" }}>Confirm Delete</DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <DialogContentText>
              Are you sure you want to delete this document?
              <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>File:</strong>{" "}
                  {documentToDelete?.original_filename || "Unknown"}
                </Typography>
                <Typography variant="body2">
                  <strong>Document Name:</strong>{" "}
                  {documentToDelete?.finalization_document_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Uploaded by:</strong> {documentToDelete?.username}
                </Typography>
              </Box>
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleDeleteCancel} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              sx={{ textTransform: "none" }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* ✅ Delete All Confirmation Dialog */}
        <Dialog
          open={deleteAllDialogOpen}
          onClose={handleDeleteAllCancel}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: "#f5f5f5" }}>
            Delete All Documents
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <DialogContentText>
              This will permanently delete <strong>all records</strong> from the
              database. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleDeleteAllCancel} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAllConfirm}
              variant="contained"
              color="error"
              sx={{ textTransform: "none" }}
            >
              Delete All
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Dashboard;
