import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiDownload, FiTrash2, FiFileText, FiCheckCircle } from "react-icons/fi";

function DocumentsRequirements() {
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

  const stats = useMemo(() => {
    const total = documents.length;
    const done = documents.filter((d) => d.status === "approved").length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [documents]);

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
    <div className="student-content" style={{ padding: "2rem" }}>
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: "1.5rem",
            padding: "1.25rem 1.5rem",
            borderRadius: "1rem",
            border: "1px solid var(--surface-border, rgba(148,163,184,0.25))",
            background: "var(--surface, rgba(10,16,36,0.55))",
            color: "var(--text-secondary, #64748b)",
            fontSize: "0.95rem",
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: "var(--text-primary, #0f172a)" }}>
            Document submission
          </strong>
          <p style={{ margin: "0.5rem 0 0" }}>
            Submit required files through the scholarship office (or your
            school&apos;s official channel). Only staff can run automated
            document scans in the admin portal.
          </p>
        </motion.div>

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
              {stats.done}/{stats.total}
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
              {stats.pct}%
            </div>
          </div>
        </motion.div>

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
                    gap: "1rem",
                    flexWrap: "wrap",
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
                          Recorded on {doc.uploadedDate}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.9rem", color: "#f59e0b", fontWeight: 500 }}>
                          Awaiting office verification
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {doc.status === "approved" ? (
                      <>
                        <motion.button
                          type="button"
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
                          type="button"
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
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

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
            <li>Use clear PDF or image files when submitting to the office</li>
            <li>Staff may use Azure document scan in the admin &quot;Document scan&quot; page</li>
            <li>Keep copies of everything you submit</li>
            <li>Meet all deadlines set by the scholarship program</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default DocumentsRequirements;
