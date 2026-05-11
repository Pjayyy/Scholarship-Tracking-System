import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUpload, FiDownload, FiTrash2, FiFileText, FiCheckCircle } from "react-icons/fi";

function DocumentsRequirements({ studentData }) {
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: "Valid ID",
      type: "requirement",
      status: "approved",
      uploadedDate: "2024-01-15",
      file: "valid_id.pdf",
    },
    {
      id: 2,
      name: "Enrollment Certificate",
      type: "requirement",
      status: "approved",
      uploadedDate: "2024-01-15",
      file: "enrollment_cert.pdf",
    },
    {
      id: 3,
      name: "Good Moral Character",
      type: "requirement",
      status: "approved",
      uploadedDate: "2024-01-15",
      file: "gmc.pdf",
    },
    {
      id: 4,
      name: "Medical Certificate",
      type: "requirement",
      status: "pending",
      uploadedDate: null,
      file: null,
    },
  ]);

  const handleFileUpload = (id) => {
    const newDocs = documents.map((doc) =>
      doc.id === id
        ? {
            ...doc,
            status: "approved",
            uploadedDate: new Date().toISOString().split("T")[0],
            file: "new_document.pdf",
          }
        : doc
    );
    setDocuments(newDocs);
  };

  const handleDeleteDocument = (id) => {
    const newDocs = documents.map((doc) =>
      doc.id === id
        ? { ...doc, status: "pending", uploadedDate: null, file: null }
        : doc
    );
    setDocuments(newDocs);
  };

  const downloadDocument = (id) => {
    const doc = documents.find((d) => d.id === id);
    if (doc?.file) {
      const link = document.createElement("a");
      link.href = "#";
      link.download = doc.file;
      link.click();
    }
  };

  const getStatusColor = (status) => {
    return status === "approved"
      ? { bg: "#f0fdf4", border: "#22c55e", text: "#16a34a" }
      : { bg: "#fffbeb", border: "#f59e0b", text: "#d97706" };
  };

  return (
    <div style={{ padding: "2rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2
          style={{
            margin: "0 0 2rem",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          📄 Documents & Requirements
        </h2>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              background: "#f0fdf4",
              borderRadius: "1rem",
              padding: "1.5rem",
              borderLeft: "4px solid #22c55e",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.5rem" }}>
              Documents Submitted
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "#16a34a",
              }}
            >
              3/4
            </div>
          </div>

          <div
            style={{
              background: "#f0f9ff",
              borderRadius: "1rem",
              padding: "1.5rem",
              borderLeft: "4px solid #3b82f6",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.5rem" }}>
              Completion Rate
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "#1d4ed8",
              }}
            >
              75%
            </div>
          </div>
        </motion.div>

        {/* Documents List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <AnimatePresence mode="popLayout">
            {documents.map((doc, idx) => {
              const colors = getStatusColor(doc.status);
              return (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{
                    background: "white",
                    borderRadius: "1.25rem",
                    padding: "1.5rem",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(0,0,0,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flex: 1 }}>
                    <div
                      style={{
                        background: colors.bg,
                        borderRadius: "0.875rem",
                        padding: "0.75rem",
                        color: colors.text,
                      }}
                    >
                      <FiFileText size={24} />
                    </div>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <strong style={{ fontSize: "1.05rem" }}>
                          {doc.name}
                        </strong>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "999px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            background: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          {doc.status === "approved" ? (
                            <>
                              <FiCheckCircle size={12} style={{ marginRight: "0.25rem", display: "inline" }} />
                              Approved
                            </>
                          ) : (
                            "Pending"
                          )}
                        </span>
                      </div>
                      {doc.uploadedDate ? (
                        <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                          Uploaded on {doc.uploadedDate}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.9rem", color: "#f59e0b", fontWeight: 500 }}>
                          No document uploaded yet
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                    }}
                  >
                    {doc.status === "pending" ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFileUpload(doc.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.75rem 1.25rem",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: "0.95rem",
                        }}
                      >
                        <FiUpload size={18} /> Upload
                      </motion.button>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => downloadDocument(doc.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 1.25rem",
                            background: "#f3f4f6",
                            color: "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "0.95rem",
                          }}
                        >
                          <FiDownload size={18} /> Download
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteDocument(doc.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0.75rem 1rem",
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <FiTrash2 size={18} />
                        </motion.button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Information Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            background: "#f0f9ff",
            borderRadius: "1rem",
            borderLeft: "4px solid #3b82f6",
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.75rem", color: "#1d4ed8" }}>
            ℹ️ Important Information
          </strong>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.25rem",
              color: "#1e40af",
              fontSize: "0.95rem",
            }}
          >
            <li>Supported formats: PDF, JPG, PNG (Max 5MB each)</li>
            <li>Ensure documents are clear and readable</li>
            <li>Submitted documents cannot be edited</li>
            <li>All documents must be submitted before deadline</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default DocumentsRequirements;
