import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Chip,
  Avatar,
  Zoom,
  Skeleton,
  IconButton,
  Tooltip,
} from "@mui/material";
import { filterAPI } from "../api/filterAPI";
import DataViewer from "../components/DataViewer";
import FilterListIcon from "@mui/icons-material/FilterList";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import RefreshIcon from "@mui/icons-material/Refresh";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const Filter = () => {
  const [filterKeys, setFilterKeys] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [keysLoading, setKeysLoading] = useState(true);

  useEffect(() => {
    fetchFilterKeys();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchDocumentsByCategory(selectedCategory);
    } else {
      setDocuments([]);
      setSelectedDocument(null);
    }
  }, [selectedCategory]);

  const fetchFilterKeys = async () => {
    try {
      setKeysLoading(true);
      const data = await filterAPI.getFilterKeys();
      setFilterKeys(data.keys || []);
    } catch (error) {
      console.error("Error fetching filter keys:", error);
    } finally {
      setKeysLoading(false);
    }
  };

  const fetchDocumentsByCategory = async (category) => {
    try {
      setLoading(true);
      const username = localStorage.getItem("username");
      const data = await filterAPI.getDocumentsByCategory(category, username);
      setDocuments(data.documents || []);

      if (data.documents && data.documents.length > 0) {
        setSelectedDocument(data.documents[0]);
      } else {
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error("Error fetching documents by category:", error);
      setDocuments([]);
      setSelectedDocument(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setSelectedDocument(null);
  };

  const handleDocumentSelect = (doc) => {
    setSelectedDocument(doc);
  };

  const handleRefresh = () => {
    if (selectedCategory) {
      fetchDocumentsByCategory(selectedCategory);
    }
  };

  const formatCategoryName = (category) => {
    return category.replace(/_/g, " ");
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      Note_Extraction: "📝",
      1003: "📋",
      Credit_Report: "💳",
      Bank_Statement: "🏦",
    };
    return iconMap[category] || "📄";
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header />

      {/* Compact Inline Header - Dropdown on Right */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: "#fff",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* Left: Title and Icon */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: "#0f62fe",
              width: 40,
              height: 40,
            }}
          >
            <FilterListIcon />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filter Documents
          </Typography>
        </Box>

        {/* Spacer - pushes everything to the right */}
        <Box sx={{ flex: 1 }} />

        {/* Right Side: Info Chip, Refresh Button, Dropdown */}
        {/* {selectedCategory && (
          <Chip
            label={`${documents.length} document${
              documents.length !== 1 ? "s" : ""
            } found`}
            color="primary"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )} */}

        {/* Dropdown - Rightmost */}
        <FormControl sx={{ minWidth: 250 }} size="small">
          <InputLabel id="category-select-label">Select Category</InputLabel>
          <Select
            labelId="category-select-label"
            value={selectedCategory}
            label="Select Category"
            onChange={handleCategoryChange}
            disabled={keysLoading || filterKeys.length === 0}
            sx={{
              bgcolor: "white",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#e0e0e0",
              },
            }}
          >
            {keysLoading ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading...
              </MenuItem>
            ) : filterKeys.length === 0 ? (
              <MenuItem disabled>No categories available</MenuItem>
            ) : (
              filterKeys.map((key) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: "1.1rem" }}>
                      {getCategoryIcon(key)}
                    </span>
                    <span>{formatCategoryName(key)}</span>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        {selectedCategory && (
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={handleRefresh}
              disabled={loading}
              size="small"
              sx={{
                bgcolor: "#e3f2fd",
                "&:hover": { bgcolor: "#bbdefb" },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Full-Width Split View */}
      {selectedCategory ? (
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left Side - Document List (25%) */}
          <Paper
            elevation={0}
            sx={{
              width: "25%",
              minWidth: 280,
              maxWidth: 400,
              borderRight: "1px solid #e0e0e0",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Left Header */}
            <Box
              sx={{
                p: 2,
                bgcolor: "#0f62fe",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DescriptionIcon fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Documents
                </Typography>
              </Box>
              <Chip
                label={documents.length}
                size="small"
                sx={{
                  bgcolor: "white",
                  color: "#0f62fe",
                  fontWeight: 700,
                  height: 24,
                }}
              />
            </Box>

            {/* Document List */}
            {loading ? (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} sx={{ mb: 1.5 }}>
                    <Skeleton
                      variant="rectangular"
                      height={56}
                      sx={{ borderRadius: 1 }}
                    />
                  </Box>
                ))}
              </Box>
            ) : documents.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 4,
                  flex: 1,
                }}
              >
                <InsertDriveFileIcon
                  sx={{ fontSize: 48, color: "#e0e0e0", mb: 2 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  No documents found
                </Typography>
              </Box>
            ) : (
              <List sx={{ overflow: "auto", flex: 1, p: 1 }}>
                {documents.map((doc, index) => (
                  <Zoom key={doc._id} in timeout={200 + index * 50}>
                    <ListItemButton
                      selected={selectedDocument?._id === doc._id}
                      onClick={() => handleDocumentSelect(doc)}
                      sx={{
                        mb: 0.5,
                        borderRadius: 1,
                        border: "1px solid transparent",
                        "&.Mui-selected": {
                          bgcolor: "#e3f2fd",
                          borderColor: "#0f62fe",
                          "&:hover": {
                            bgcolor: "#bbdefb",
                          },
                        },
                        "&:hover": {
                          bgcolor: "#f5f5f5",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          gap: 1.5,
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor:
                              selectedDocument?._id === doc._id
                                ? "#0f62fe"
                                : "#f5f5f5",
                            color:
                              selectedDocument?._id === doc._id
                                ? "white"
                                : "#757575",
                            width: 36,
                            height: 36,
                          }}
                        >
                          <InsertDriveFileIcon fontSize="small" />
                        </Avatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight:
                                  selectedDocument?._id === doc._id ? 600 : 500,
                                color:
                                  selectedDocument?._id === doc._id
                                    ? "#0f62fe"
                                    : "text.primary",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {doc.original_filename}
                            </Typography>
                          }
                          // secondary={
                          //   <Typography
                          //     variant="caption"
                          //     color="text.secondary"
                          //     sx={{
                          //       overflow: "hidden",
                          //       textOverflow: "ellipsis",
                          //       whiteSpace: "nowrap",
                          //       display: "block",
                          //     }}
                          //   >
                          //     {doc.finalization_document_name || "No title"}
                          //   </Typography>
                          // }
                        />
                        {selectedDocument?._id === doc._id && (
                          <ArrowForwardIcon
                            fontSize="small"
                            sx={{ color: "#0f62fe" }}
                          />
                        )}
                      </Box>
                    </ListItemButton>
                  </Zoom>
                ))}
              </List>
            )}
          </Paper>

          {/* Right Side - Document Data (75%) */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              bgcolor: "#fafafa",
            }}
          >
            {selectedDocument ? (
              <>
                {/* Document Info Bar - Horizontal Split */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#fff",
                    borderBottom: "1px solid #e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  {/* Left: Filename with Icon */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "#e3f2fd",
                        color: "#0f62fe",
                        width: 40,
                        height: 40,
                      }}
                    >
                      <InsertDriveFileIcon />
                    </Avatar>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {selectedDocument.original_filename}
                    </Typography>
                  </Box>

                  {/* Right: Category and Record Count */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexShrink: 0,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCategoryName(selectedCategory)}
                    </Typography>
                    <Chip
                      label={`${
                        selectedDocument.category_data?.length || 0
                      } record${
                        selectedDocument.category_data?.length !== 1 ? "s" : ""
                      }`}
                      size="small"
                      color="primary"
                      sx={{
                        fontWeight: 600,
                        height: 24,
                      }}
                    />
                  </Box>
                </Box>

                {/* Data Content - Full Width */}
                <Box sx={{ flex: 1, overflow: "auto", bgcolor: "#fff" }}>
                  <DataViewer
                    categoryData={selectedDocument.category_data || []}
                    categoryName={selectedCategory}
                  />
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  bgcolor: "#fff",
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "#f5f5f5",
                    width: 72,
                    height: 72,
                    mb: 2,
                  }}
                >
                  <InsertDriveFileIcon
                    sx={{ fontSize: 36, color: "#bdbdbd" }}
                  />
                </Avatar>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {documents.length > 0 ? "Select a Document" : "No Documents"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {documents.length > 0
                    ? "Choose a document from the list to view details"
                    : "No documents found for this category"}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        /* Empty State - No Category Selected */
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#fafafa",
          }}
        >
          <Box sx={{ textAlign: "center", p: 5 }}>
            <Avatar
              sx={{
                bgcolor: "#e3f2fd",
                width: 80,
                height: 80,
                margin: "0 auto",
                mb: 3,
              }}
            >
              <FilterListIcon sx={{ fontSize: 40, color: "#0f62fe" }} />
            </Avatar>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, mb: 1, color: "#424242" }}
            >
              Select a Category to Start
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Choose a category from the dropdown above to filter and view
              documents
            </Typography>
            {filterKeys.length > 0 && (
              <Chip
                label={`${filterKeys.length} Categories Available`}
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Filter;
