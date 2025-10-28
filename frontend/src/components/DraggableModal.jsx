import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

const DraggableModal = ({
  open,
  onClose,
  title,
  children,
  minWidth = 400,
  maxWidth = "90vw",
  initialWidth = "auto",
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [modalWidth, setModalWidth] = useState(initialWidth);
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 });
  const dialogRef = useRef(null);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 });
      setModalWidth(initialWidth);
    }
  }, [open, initialWidth]);

  // Dragging handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging && !isResizing) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const newWidth = Math.max(minWidth, resizeStart.width + deltaX * 2);
      setModalWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Resize handlers
  const handleResizeStart = (e, side) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    const currentWidth =
      dialogRef.current?.querySelector(".MuiDialog-paper")?.offsetWidth ||
      minWidth;
    setResizeStart({
      x: e.clientX,
      width: currentWidth,
    });
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  return (
    <Dialog
      ref={dialogRef}
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          position: "fixed",
          m: 0,
          width: modalWidth === "auto" ? "auto" : `${modalWidth}px`,
          minWidth: `${minWidth}px`,
          maxWidth: maxWidth,
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? "grabbing" : "default",
          userSelect: isDragging || isResizing ? "none" : "auto",
          resize: "none",
          overflow: "visible",
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          alignItems: "flex-start",
          marginTop: "10vh",
        },
      }}
    >
      {/* Left Resize Handle */}
      <Box
        onMouseDown={(e) => handleResizeStart(e, "left")}
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "5px",
          cursor: "ew-resize",
          zIndex: 10,
          "&:hover": {
            bgcolor: "primary.main",
            opacity: 0.5,
          },
        }}
      />

      {/* Right Resize Handle */}
      <Box
        onMouseDown={(e) => handleResizeStart(e, "right")}
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "5px",
          cursor: "ew-resize",
          zIndex: 10,
          "&:hover": {
            bgcolor: "primary.main",
            opacity: 0.5,
          },
        }}
      />

      <DialogTitle
        onMouseDown={handleMouseDown}
        sx={{
          cursor: isDragging ? "grabbing" : "grab",
          bgcolor: "#0f62fe",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.5,
          px: 2,
          userSelect: "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DragIndicatorIcon fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: "white",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.1)",
            },
          }}
          size="small"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          maxHeight: "70vh",
          overflow: "auto",
          minWidth: `${minWidth - 48}px`,
        }}
      >
        {children}
      </DialogContent>

      {/* Resize Indicator */}
      {isResizing && (
        <Box
          sx={{
            position: "fixed",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            bgcolor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: "0.875rem",
            zIndex: 9999,
          }}
        >
          Width: {Math.round(modalWidth)}px
        </Box>
      )}
    </Dialog>
  );
};

export default DraggableModal;
