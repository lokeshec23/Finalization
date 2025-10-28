import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Finalization from "./Finalization";

const FinalizationView = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get document data from navigation state
  const documentData = location.state?.documentData;
  const documentName = location.state?.documentName;

  if (!documentData) {
    // If no data, redirect to dashboard
    navigate("/dashboard");
    return null;
  }

  // Render the Finalization component with the document data
  return (
    <Finalization
      viewMode={true}
      initialData={documentData}
      initialDocName={documentName}
    />
  );
};

export default FinalizationView;
