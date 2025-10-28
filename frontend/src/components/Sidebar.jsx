import React from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

const Sidebar = ({ categories, activeCategory, onCategoryChange }) => {
  const formatCategoryName = (category) => {
    return category.replace(/_/g, " ");
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: "#0f62fe",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Categories
        </Typography>
      </Box>

      {/* List */}
      <List sx={{ p: 0, flex: 1, overflow: "auto" }}>
        {categories.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No categories found
            </Typography>
          </Box>
        ) : (
          categories.map((category) => (
            <ListItemButton
              key={category}
              selected={activeCategory === category}
              onClick={() => onCategoryChange(category)}
              sx={{
                py: 1.5,
                px: 2,
                borderLeft:
                  activeCategory === category
                    ? "4px solid #0f62fe"
                    : "4px solid transparent",
                "&.Mui-selected": {
                  bgcolor: "#e0f0ff",
                  "&:hover": {
                    bgcolor: "#d0e8ff",
                  },
                },
                "&:hover": {
                  bgcolor: "#f5f5f5",
                },
              }}
            >
              <ListItemText
                primary={formatCategoryName(category)}
                sx={{
                  "& .MuiListItemText-primary": {
                    fontWeight: activeCategory === category ? 600 : 400,
                    fontSize: "0.95rem",
                  },
                }}
              />
            </ListItemButton>
          ))
        )}
      </List>
    </Box>
  );
};

export default Sidebar;
