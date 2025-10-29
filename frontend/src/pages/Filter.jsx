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
  Divider,
  Avatar,
  Zoom,
  Skeleton,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { loanAPI } from "../api/loanAPI";
import FilterListIcon from "@mui/icons-material/FilterList";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import RefreshIcon from "@mui/icons-material/Refresh";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const Filter = () => {
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryFiles, setCategoryFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loansLoading, setLoansLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  useEffect(() => {
    if (selectedLoan && selectedCategory) {
      loadCategoryFiles();
    }
  }, [selectedLoan, selectedCategory]);

  const fetchLoans = async () => {
    try {
      setLoansLoading(true);
      const username = localStorage.getItem("username");
      const data = await loanAPI.listLoans(username);
      setLoans(data.loans || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoansLoading(false);
    }
  };

  const handleLoanSelect = async (loan) => {
    try {
      setLoading(true);
      setSelectedLoan(null);
      setCategories([]);
      setSelectedCategory("");
      setCategoryFiles([]);
      setSelectedFile(null);

      const username = localStorage.getItem("username");
      const fullLoanData = await loanAPI.getLoan(loan.loan_id, username);

      setSelectedLoan(fullLoanData);

      // Extract categories from input_data
      if (fullLoanData.input_data) {
        const cats = Object.keys(fullLoanData.input_data);
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching loan details:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryFiles = () => {
    if (selectedLoan && selectedCategory && selectedLoan.input_data) {
      const files = selectedLoan.input_data[selectedCategory] || [];
      setCategoryFiles(files);
      if (files.length > 0) {
        setSelectedFile(files[0]);
      } else {
        setSelectedFile(null);
      }
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setSelectedFile(null);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleRefresh = () => {
    fetchLoans();
  };

  const formatCategoryName = (category) => {
    return category.replace(/_/g, " ");
  };

  const formatKey = (key) => {
    return key
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    if (Array.isArray(value)) {
      return value.join(", ") || "—";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header />

      {/* Compact Inline Header */}
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
        {/* Left: Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "#0f62fe", width: 40, height: 40 }}>
            <FilterListIcon />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filter Input Documents
          </Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Right Side: Info & Controls */}
        {selectedLoan && (
          <>
            <Chip
              label={`Loan: ${selectedLoan.loan_id}`}
              color="primary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            {selectedCategory && (
              <Chip
                label={`${categoryFiles.length} file${
                  categoryFiles.length !== 1 ? "s" : ""
                }`}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </>
        )}

        <Tooltip title="Refresh">
          <IconButton
            onClick={handleRefresh}
            disabled={loansLoading}
            size="small"
            sx={{ bgcolor: "#e3f2fd", "&:hover": { bgcolor: "#bbdefb" } }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Category Dropdown */}
        {selectedLoan && categories.length > 0 && (
          <FormControl sx={{ minWidth: 250 }} size="small">
            <InputLabel>Select Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Select Category"
              onChange={handleCategoryChange}
              sx={{ bgcolor: "white" }}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {formatCategoryName(cat)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Sidebar - Loan List */}
        <Paper
          elevation={0}
          sx={{
            width: "280px",
            minWidth: "280px",
            borderRight: "1px solid #e0e0e0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: 1.5,
              bgcolor: "#0f62fe",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, fontSize: "0.95rem" }}
            >
              Loans
            </Typography>
            <Chip
              label={loans.length}
              size="small"
              sx={{
                bgcolor: "white",
                color: "#0f62fe",
                fontWeight: 700,
                height: 22,
              }}
            />
          </Box>

          {loansLoading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3, 4].map((i) => (
                <Box key={i} sx={{ mb: 1.5 }}>
                  <Skeleton
                    variant="rectangular"
                    height={56}
                    sx={{ borderRadius: 1 }}
                  />
                </Box>
              ))}
            </Box>
          ) : loans.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No loans found
              </Typography>
            </Box>
          ) : (
            <List sx={{ overflow: "auto", flex: 1, p: 1 }}>
              {loans.map((loan, index) => (
                <Zoom key={loan._id} in timeout={200 + index * 50}>
                  <ListItemButton
                    selected={selectedLoan?.loan_id === loan.loan_id}
                    onClick={() => handleLoanSelect(loan)}
                    sx={{
                      mb: 0.5,
                      borderRadius: 1,
                      border: "1px solid transparent",
                      "&.Mui-selected": {
                        bgcolor: "#e3f2fd",
                        borderColor: "#0f62fe",
                        "&:hover": { bgcolor: "#bbdefb" },
                      },
                      "&:hover": { bgcolor: "#f5f5f5" },
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
                            selectedLoan?.loan_id === loan.loan_id
                              ? "#0f62fe"
                              : "#f5f5f5",
                          color:
                            selectedLoan?.loan_id === loan.loan_id
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
                                selectedLoan?.loan_id === loan.loan_id
                                  ? 600
                                  : 500,
                              color:
                                selectedLoan?.loan_id === loan.loan_id
                                  ? "#0f62fe"
                                  : "text.primary",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {loan.loan_id}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {loan.input_categories?.length || 0} categories
                          </Typography>
                        }
                      />
                      {selectedLoan?.loan_id === loan.loan_id && (
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

        {/* Middle - File List */}
        {selectedLoan && selectedCategory && (
          <Paper
            elevation={0}
            sx={{
              width: "300px",
              minWidth: "300px",
              borderRight: "1px solid #e0e0e0",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                p: 1.5,
                bgcolor: "#28a745",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, fontSize: "0.95rem" }}
              >
                Files
              </Typography>
              <Chip
                label={categoryFiles.length}
                size="small"
                sx={{
                  bgcolor: "white",
                  color: "#28a745",
                  fontWeight: 700,
                  height: 22,
                }}
              />
            </Box>

            <List sx={{ overflow: "auto", flex: 1, p: 1 }}>
              {categoryFiles.map((file, index) => (
                <ListItemButton
                  key={index}
                  selected={selectedFile?.filename === file.filename}
                  onClick={() => handleFileSelect(file)}
                  sx={{
                    mb: 0.5,
                    borderRadius: 1,
                    "&.Mui-selected": {
                      bgcolor: "#e8f5e9",
                      borderColor: "#28a745",
                      "&:hover": { bgcolor: "#c8e6c9" },
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight:
                            selectedFile?.filename === file.filename
                              ? 600
                              : 400,
                          fontSize: "0.85rem",
                        }}
                      >
                        {file.filename}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}

        {/* Right - File Data Display */}
        <Box sx={{ flex: 1, overflow: "auto", bgcolor: "#f8f9fa", p: 2 }}>
          {selectedFile ? (
            <Paper elevation={2} sx={{ overflow: "hidden" }}>
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
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, fontSize: "1rem" }}
                >
                  {selectedFile.filename}
                </Typography>
                <Chip
                  label={formatCategoryName(selectedCategory)}
                  size="small"
                  sx={{ bgcolor: "white", color: "#0f62fe", fontWeight: 600 }}
                />
              </Box>

              <TableContainer sx={{ maxHeight: "calc(100vh - 250px)" }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="left"
                        sx={{
                          fontWeight: 700,
                          bgcolor: "#f8f9fa",
                          borderBottom: "2px solid #0f62fe",
                          width: "40%",
                          py: 1,
                          px: 2,
                        }}
                      >
                        Field
                      </TableCell>
                      <TableCell
                        align="left"
                        sx={{
                          fontWeight: 700,
                          bgcolor: "#f8f9fa",
                          borderBottom: "2px solid #0f62fe",
                          py: 1,
                          px: 2,
                        }}
                      >
                        Values
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(selectedFile.data)
                      .filter(([key]) => !key.startsWith("_"))
                      .map(([key, value]) => (
                        <TableRow key={key} hover>
                          <TableCell
                            align="left"
                            sx={{
                              fontWeight: 500,
                              color: "#616161",
                              py: 1.5,
                              px: 2,
                            }}
                          >
                            {formatKey(key)}
                          </TableCell>
                          <TableCell align="left" sx={{ py: 1.5, px: 2 }}>
                            {formatValue(value)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Avatar
                  sx={{
                    bgcolor: "#e3f2fd",
                    width: 80,
                    height: 80,
                    margin: "0 auto",
                    mb: 2,
                  }}
                >
                  <FilterListIcon sx={{ fontSize: 40, color: "#0f62fe" }} />
                </Avatar>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {!selectedLoan
                    ? "Select a Loan"
                    : !selectedCategory
                    ? "Select a Category"
                    : "Select a File"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {!selectedLoan
                    ? "Choose a loan from the left to view input documents"
                    : !selectedCategory
                    ? "Choose a category to view files"
                    : "Choose a file to view its data"}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Filter;
