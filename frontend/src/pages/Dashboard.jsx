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

const Dashboard = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [viewLoading, setViewLoading] = useState(false);

  // Add this useEffect in your Dashboard component

  useEffect(() => {
    // Initial fetch
    fetchDocuments();

    // Listen for upload events
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
      setViewLoading(true);
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
          fetchedDocument: fetchedDoc, // ✅ Pass complete document
          documentName: fetchedDoc.finalization_document_name,
          originalFileName: fetchedDoc.original_filename,
          documentId: fetchedDoc._id,
        },
      });
    } catch (error) {
      console.error("Error fetching document:", error);
      showSnackbar("Failed to load document", "error");
    } finally {
      setViewLoading(false);
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

  return (
    <Box>
      <Header />
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

        {/* Statistics */}
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ py: 0.5 }}>
            Total Documents: <strong>{documents.length}</strong>
          </Alert>
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
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <InsertDriveFileIcon fontSize="small" color="primary" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {doc.original_filename || "Unknown.json"}
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
                            disabled={viewLoading}
                            sx={{
                              "&:hover": {
                                bgcolor: "#e3f2fd",
                              },
                            }}
                          >
                            {viewLoading ? (
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
